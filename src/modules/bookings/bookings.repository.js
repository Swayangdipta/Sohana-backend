/**
 * Bookings Repository
 * 
 * Provides basic non-transactional database query methods for bookings.
 * 
 * Note: Core booking operations (create/cancel) are handled directly in the
 * service layer using a database connection to maintain transaction scope.
 * This repository is for simple read operations.
 */

const pool = require('../../config/database');

/**
 * Find bookings by user ID with pagination
 * @param {number} userId - The user's ID
 * @param {number} offset - Pagination offset
 * @param {number} limit - Pagination limit
 * @returns {Promise<Array>} List of bookings
 */
const findByUserId = async (userId, offset, limit) => {
  const [rows] = await pool.query(
    'SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC LIMIT ?, ?',
    [userId, offset, limit]
  );
  return rows;
};

/**
 * Find a booking by its ID
 * @param {number} bookingId - The booking ID
 * @returns {Promise<Object|null>} The booking or null if not found
 */
const findById = async (bookingId) => {
  const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Find booking items by booking ID
 * @param {number} bookingId - The booking ID
 * @returns {Promise<Array>} List of booking items
 */
const findItemsByBookingId = async (bookingId) => {
  const [rows] = await pool.query('SELECT * FROM booking_items WHERE booking_id = ?', [bookingId]);
  return rows;
};

/**
 * Find guests by booking ID
 * @param {number} bookingId - The booking ID
 * @returns {Promise<Array>} List of guests
 */
const findGuestsByBookingId = async (bookingId) => {
  const [rows] = await pool.query('SELECT * FROM booking_guests WHERE booking_id = ?', [bookingId]);
  return rows;
};

/**
 * Find cancellation record by booking ID
 * @param {number} bookingId - The booking ID
 * @returns {Promise<Object|null>} Cancellation details or null
 */
const findCancellationByBookingId = async (bookingId) => {
  const [rows] = await pool.query('SELECT * FROM booking_cancellations WHERE booking_id = ?', [bookingId]);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Count total bookings for a user
 * @param {number} userId - The user's ID
 * @returns {Promise<number>} Total count
 */
const countByUserId = async (userId) => {
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM bookings WHERE user_id = ?', [userId]);
  return rows[0].count;
};

module.exports = {
  findByUserId,
  findById,
  findItemsByBookingId,
  findGuestsByBookingId,
  findCancellationByBookingId,
  countByUserId
};
