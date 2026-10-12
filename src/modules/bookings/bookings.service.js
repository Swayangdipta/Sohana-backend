/**
 * Bookings Service
 * 
 * Contains all business logic for hotel bookings.
 * 
 * CRITICAL DESIGN DECISIONS:
 * 1. Uses MySQL transactions to ensure atomicity across complex operations (creating/cancelling bookings).
 * 2. Uses atomic UPDATE for inventory management to prevent double-booking race conditions.
 * 3. Stores price SNAPSHOTS — booking prices are frozen at booking time, independent of future price changes.
 * 4. Currently defaults to PAY_AT_HOTEL payment method (no payment gateway integration yet).
 */

const pool = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { BOOKING_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, DEFAULT_TAX_RATE, DEFAULT_CURRENCY, CANCELLATION_STATUS } = require('../../utils/constants');
const { generateBookingReference, calculateNights, getDatesInRange, paginate } = require('../../utils/helpers');
const emailService = require('../notifications/email.service');

/**
 * Creates a new hotel booking with full transactional safety.
 * 
 * Flow:
 * 1. Validate hotel and room exist and are active
 * 2. Validate dates and capacity
 * 3. Begin transaction
 * 4. Atomically reserve inventory for each night (Double booking prevention)
 * 5. Calculate and snapshot pricing
 * 6. Create booking record and items
 * 7. Create guest records
 * 8. Commit transaction
 * 9. Send confirmation email (outside transaction)
 * 
 * @param {number} userId - The ID of the user creating the booking
 * @param {Object} bookingData - The booking payload
 * @returns {Promise<Object>} The created booking details
 */
const createBooking = async (userId, bookingData) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // ===== STEP 1: Validate hotel and room =====
    const [hotels] = await connection.query('SELECT * FROM hotels WHERE id = ? AND status = 1', [bookingData.hotel_id]);
    if (hotels.length === 0) throw ApiError.notFound('Hotel not found or not available');
    const hotel = hotels[0];
    
    const [rooms] = await connection.query('SELECT * FROM hotel_rooms WHERE id = ? AND hotel_id = ? AND status = 1', [bookingData.room_id, bookingData.hotel_id]);
    if (rooms.length === 0) throw ApiError.notFound('Room type not found or not available');
    const room = rooms[0];
    
    // Validate guest capacity
    if (room.capacity < bookingData.num_adults) {
      throw ApiError.badRequest(`Room capacity (${room.capacity}) is less than requested adults (${bookingData.num_adults}). Please book additional rooms.`);
    }
    
    // ===== STEP 2: Validate dates =====
    const checkInDate = new Date(bookingData.check_in);
    const checkOutDate = new Date(bookingData.check_out);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) throw ApiError.badRequest('Check-in date cannot be in the past');
    if (checkOutDate <= checkInDate) throw ApiError.badRequest('Check-out date must be after check-in date');
    
    const numNights = calculateNights(bookingData.check_in, bookingData.check_out);
    const dates = getDatesInRange(bookingData.check_in, bookingData.check_out);
    const numRooms = parseInt(bookingData.num_rooms);
    
    // ===== STEP 3: Atomic inventory reservation =====
    /**
     * CONCURRENCY PROTECTION — Double booking prevention
     * 
     * For each night in the booking:
     * 1. Try UPDATE room_availability SET available_rooms = available_rooms - N
     *    WHERE room_id = ? AND date = ? AND available_rooms >= N
     *    → MySQL locks this row during the UPDATE. If two users race,
     *      only one UPDATE will succeed (the other sees available_rooms < N)
     * 
     * 2. If no row exists (UPDATE affects 0 rows and not because of insufficient inventory),
     *    INSERT a new row with available_rooms = total_rooms - N
     *    Use INSERT ... ON DUPLICATE KEY UPDATE as a safety net
     * 
     * 3. If inventory is insufficient at any point → ROLLBACK entire transaction
     */
    let totalPrice = 0;
    
    for (const date of dates) {
      // Try to decrement existing availability atomically
      const [updateResult] = await connection.query(
        `UPDATE room_availability 
         SET available_rooms = available_rooms - ?, updated_at = NOW()
         WHERE room_id = ? AND date = ? AND available_rooms >= ?`,
        [numRooms, room.id, date, numRooms]
      );
      
      if (updateResult.affectedRows === 0) {
        // No row existed for this date — check if we can create one
        // Comment: first booking for this room on this date, need to initialize inventory
        
        // Verify total_rooms is enough
        if (room.total_rooms < numRooms) {
          throw ApiError.badRequest(`Insufficient rooms available. Only ${room.total_rooms} ${room.room_type} rooms exist.`);
        }
        
        // Insert new availability record with reduced inventory
        // Use INSERT ... ON DUPLICATE KEY UPDATE to handle race condition where
        // another transaction inserts between our failed UPDATE and this INSERT
        const [insertResult] = await connection.query(
          `INSERT INTO room_availability (room_id, date, available_rooms, status)
           VALUES (?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE 
             available_rooms = CASE 
               WHEN available_rooms >= ? THEN available_rooms - ?
               ELSE available_rooms 
             END,
             updated_at = NOW()`,
          [room.id, date, room.total_rooms - numRooms, numRooms, numRooms]
        );
        
        // Verify the insert/update actually reserved the rooms
        // If ON DUPLICATE KEY fired and availability was insufficient, check current state
        if (insertResult.affectedRows === 0) {
          throw ApiError.badRequest(`Rooms are no longer available for ${date}. Please try again.`);
        }
        
        // Double-check: if the ON DUPLICATE KEY path was taken, verify rooms were actually decremented
        if (insertResult.insertId === 0) {
          // ON DUPLICATE KEY UPDATE was triggered
          const [checkRows] = await connection.query(
            'SELECT available_rooms FROM room_availability WHERE room_id = ? AND date = ?',
            [room.id, date]
          );
          if (checkRows.length === 0 || checkRows[0].available_rooms < 0) {
            throw ApiError.badRequest(`Rooms are no longer available for ${date}. Please try again.`);
          }
        }
      }
      
      // Get effective price for this night
      const [priceRows] = await connection.query(
        'SELECT price_override FROM room_availability WHERE room_id = ? AND date = ?',
        [room.id, date]
      );
      const nightPrice = (priceRows.length > 0 && priceRows[0].price_override) 
        ? parseFloat(priceRows[0].price_override) 
        : parseFloat(room.price_per_night);
      totalPrice += nightPrice;
    }
    
    // ===== STEP 4: Calculate pricing snapshot =====
    const pricePerNight = parseFloat((totalPrice / numNights).toFixed(2));
    const subtotal = parseFloat((totalPrice * numRooms).toFixed(2));
    const discount = 0;  // no discount system implemented yet
    const taxAmount = parseFloat(((subtotal - discount) * DEFAULT_TAX_RATE / 100).toFixed(2));
    const totalAmount = parseFloat((subtotal - discount + taxAmount).toFixed(2));
    
    // ===== STEP 5: Generate booking reference =====
    // Comment: retry up to 3 times in case of collision (extremely unlikely)
    let bookingReference;
    let referenceAttempts = 0;
    while (referenceAttempts < 3) {
      bookingReference = generateBookingReference();
      const [existing] = await connection.query('SELECT id FROM bookings WHERE booking_reference = ?', [bookingReference]);
      if (existing.length === 0) break;
      referenceAttempts++;
      if (referenceAttempts >= 3) throw ApiError.internal('Failed to generate unique booking reference');
    }
    
    // ===== STEP 6: Create booking record =====
    const [bookingResult] = await connection.query(
      `INSERT INTO bookings 
        (booking_reference, user_id, hotel_id, check_in, check_out, 
         num_rooms, num_adults, num_children, subtotal, discount, 
         tax_amount, total_amount, currency, booking_status, 
         payment_status, payment_method, contact_name, contact_email, 
         contact_phone, special_requests)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingReference, userId, bookingData.hotel_id,
        bookingData.check_in, bookingData.check_out,
        numRooms, bookingData.num_adults, bookingData.num_children || 0,
        subtotal, discount, taxAmount, totalAmount, DEFAULT_CURRENCY,
        BOOKING_STATUS.CONFIRMED,  // Pay at hotel = immediately confirmed
        PAYMENT_STATUS.PAY_AT_HOTEL,
        PAYMENT_METHOD.PAY_AT_HOTEL,
        bookingData.contact_name, bookingData.contact_email,
        bookingData.contact_phone, bookingData.special_requests || null
      ]
    );
    const bookingId = bookingResult.insertId;
    
    // ===== STEP 7: Create booking item (price snapshot) =====
    // Comment: these values are FROZEN — they never change even if room prices change later
    await connection.query(
      `INSERT INTO booking_items 
        (booking_id, room_id, room_type_snapshot, rate_plan_snapshot, 
         quantity, price_per_night, num_nights, discount, 
         tax_percentage, tax_amount, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingId, room.id, room.room_type, null,
        numRooms, pricePerNight, numNights, discount,
        DEFAULT_TAX_RATE, taxAmount, totalAmount
      ]
    );
    
    // ===== STEP 8: Create guest records =====
    if (bookingData.guests && bookingData.guests.length > 0) {
      for (const guest of bookingData.guests) {
        await connection.query(
          `INSERT INTO booking_guests 
            (booking_id, first_name, last_name, age, gender, 
             guest_type, is_primary, email, phone)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            bookingId, guest.first_name, guest.last_name || null,
            guest.age || null, guest.gender || null,
            guest.guest_type || 'ADULT', guest.is_primary ? 1 : 0,
            guest.email || null, guest.phone || null
          ]
        );
      }
    }
    
    // ===== STEP 9: Commit transaction =====
    await connection.commit();
    
    // ===== STEP 10: Build response and send email (outside transaction) =====
    // Comment: email sending is outside the transaction — if email fails, booking still succeeds
    const booking = {
      id: bookingId,
      booking_reference: bookingReference,
      hotel_name: hotel.hotel_name,
      hotel_address: hotel.address,
      hotel_contact: hotel.contact_number,
      check_in: bookingData.check_in,
      check_out: bookingData.check_out,
      num_rooms: numRooms,
      num_adults: bookingData.num_adults,
      num_children: bookingData.num_children || 0,
      room_type: room.room_type,
      price_per_night: pricePerNight,
      num_nights: numNights,
      subtotal,
      discount,
      tax_rate: DEFAULT_TAX_RATE,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      currency: DEFAULT_CURRENCY,
      booking_status: BOOKING_STATUS.CONFIRMED,
      payment_status: PAYMENT_STATUS.PAY_AT_HOTEL,
      payment_method: PAYMENT_METHOD.PAY_AT_HOTEL,
      contact_name: bookingData.contact_name,
      contact_email: bookingData.contact_email,
      contact_phone: bookingData.contact_phone,
      special_requests: bookingData.special_requests || null,
      guests: bookingData.guests || []
    };
    
    // Send confirmation email (non-blocking)
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length > 0) {
      emailService.sendBookingConfirmationEmail(users[0], booking)
        .catch(err => console.error('Failed to send booking confirmation email:', err));
    }
    
    return booking;
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get all bookings for a user with pagination.
 * Only returns bookings belonging to the authenticated user.
 * 
 * @param {number} userId - The user's ID
 * @param {Object} query - Query parameters including page and limit
 * @returns {Promise<Object>} Paginated bookings result
 */
const getBookings = async (userId, query) => {
  const { offset, limit } = paginate(query.page, query.limit);
  
  const [bookings] = await pool.query(
    `SELECT b.*, h.hotel_name, h.address as hotel_address, h.featured_image as hotel_image
     FROM bookings b
     JOIN hotels h ON b.hotel_id = h.id
     WHERE b.user_id = ?
     ORDER BY b.created_at DESC
     LIMIT ?, ?`,
    [userId, offset, limit]
  );
  
  const [countResult] = await pool.query(
    'SELECT COUNT(*) as total FROM bookings WHERE user_id = ?',
    [userId]
  );
  const total = countResult[0].total;
  
  return {
    bookings,
    pagination: {
      page: parseInt(query.page) || 1,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get detailed booking info including items, guests, and cancellation.
 * IMPORTANT: verifies the booking belongs to the requesting user.
 * 
 * @param {number} bookingId - The booking ID
 * @param {number} userId - The requesting user's ID
 * @returns {Promise<Object>} The booking details
 */
const getBookingById = async (bookingId, userId) => {
  // Get base booking with hotel info
  const [bookings] = await pool.query(
    `SELECT b.*, 
      h.hotel_name, h.address as hotel_address, h.contact_number as hotel_contact,
      h.email as hotel_email, h.featured_image as hotel_image,
      s.state_name, c.city_name, l.location_name
     FROM bookings b
     JOIN hotels h ON b.hotel_id = h.id
     JOIN states s ON h.state_id = s.id
     JOIN cities c ON h.city_id = c.id
     JOIN locations l ON h.location_id = l.id
     WHERE b.id = ?`,
    [bookingId]
  );
  if (bookings.length === 0) throw ApiError.notFound('Booking not found');
  
  const booking = bookings[0];
  
  // Authorization check — user can only view their own bookings
  if (booking.user_id !== userId) throw ApiError.forbidden('You are not authorized to view this booking');
  
  // Get booking items
  const [items] = await pool.query('SELECT * FROM booking_items WHERE booking_id = ?', [bookingId]);
  booking.items = items;
  
  // Get guests
  const [guests] = await pool.query('SELECT * FROM booking_guests WHERE booking_id = ?', [bookingId]);
  booking.guests = guests;
  
  // Get cancellation info if exists
  const [cancellation] = await pool.query('SELECT * FROM booking_cancellations WHERE booking_id = ?', [bookingId]);
  booking.cancellation = cancellation.length > 0 ? cancellation[0] : null;
  
  return booking;
};

/**
 * Cancels a booking and restores room inventory.
 * Uses a transaction to ensure atomicity.
 * 
 * Flow:
 * 1. Verify booking exists and belongs to user
 * 2. Verify booking is in a cancellable state
 * 3. Begin transaction
 * 4. Update booking status to CANCELLED
 * 5. Create cancellation record
 * 6. Restore room inventory for each night
 * 7. Commit
 * 8. Send cancellation email
 * 
 * @param {number} bookingId - The booking to cancel
 * @param {number} userId - The user requesting cancellation
 * @param {string} reason - Optional cancellation reason
 * @returns {Promise<Object>} Cancelled booking summary
 */
const cancelBooking = async (bookingId, userId, reason) => {
  // Step 1: Find booking
  const [bookings] = await pool.query(
    'SELECT b.*, h.hotel_name, h.address as hotel_address FROM bookings b JOIN hotels h ON b.hotel_id = h.id WHERE b.id = ?',
    [bookingId]
  );
  if (bookings.length === 0) throw ApiError.notFound('Booking not found');
  
  const booking = bookings[0];
  
  // Authorization check
  if (booking.user_id !== userId) throw ApiError.forbidden('You are not authorized to cancel this booking');
  
  // Step 2: Check cancellable status
  const cancellableStatuses = [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED];
  if (!cancellableStatuses.includes(booking.booking_status)) {
    throw ApiError.badRequest(`Booking cannot be cancelled. Current status: ${booking.booking_status}`);
  }
  
  // Get booking items to know which rooms to restore
  const [items] = await pool.query('SELECT * FROM booking_items WHERE booking_id = ?', [bookingId]);
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Step 4: Update booking status
    await connection.query(
      'UPDATE bookings SET booking_status = ?, updated_at = NOW() WHERE id = ?',
      [BOOKING_STATUS.CANCELLED, bookingId]
    );
    
    // Step 5: Create cancellation record
    // Comment: for PAY_AT_HOTEL, refund_amount is 0 since no payment was made
    await connection.query(
      `INSERT INTO booking_cancellations 
        (booking_id, cancelled_by, cancellation_reason, refund_amount, cancellation_status, cancelled_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [bookingId, userId, reason || null, 0, CANCELLATION_STATUS.APPROVED]
    );
    
    // Step 6: Restore room inventory
    // Comment: add back the rooms for each night in the booking date range
    const dates = getDatesInRange(booking.check_in, booking.check_out);
    
    for (const item of items) {
      for (const date of dates) {
        await connection.query(
          `UPDATE room_availability 
           SET available_rooms = available_rooms + ?, updated_at = NOW()
           WHERE room_id = ? AND date = ?`,
          [item.quantity, item.room_id, date]
        );
      }
    }
    
    await connection.commit();
    
    // Step 8: Send cancellation email (non-blocking, outside transaction)
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length > 0) {
      const cancellationData = {
        ...booking,
        booking_status: BOOKING_STATUS.CANCELLED,
        cancellation_reason: reason || 'No reason provided'
      };
      emailService.sendBookingCancellationEmail(users[0], cancellationData)
        .catch(err => console.error('Failed to send cancellation email:', err));
    }
    
    return {
      id: bookingId,
      booking_reference: booking.booking_reference,
      booking_status: BOOKING_STATUS.CANCELLED,
      cancelled_at: new Date().toISOString()
    };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking
};
