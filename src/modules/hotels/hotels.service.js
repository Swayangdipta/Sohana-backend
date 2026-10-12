/**
 * @file hotels.service.js
 * @description Business logic for the Hotels module. Processes raw data from the repository layer.
 */

const hotelsRepo = require('./hotels.repository');
const ApiError = require('../../utils/ApiError');
const { paginate, getDatesInRange, calculateNights } = require('../../utils/helpers');
const { DEFAULT_TAX_RATE, DEFAULT_CURRENCY } = require('../../utils/constants');

/**
 * @function getHotels
 * @description Search and list hotels with filtering, sorting, and pagination.
 * Supports: destination, checkIn/checkOut, rooms, adults, children, priceMin, priceMax, amenities, sort, page, limit
 * @param {Object} query - Request query parameters
 * @returns {Object} Hotels list and pagination info
 */
const getHotels = async (query) => {
  // Parse pagination
  const { offset, limit } = paginate(query.page, query.limit);

  // Build filter object for repository
  const filters = {
    destination: query.destination || null,  // searches across city, location, state, hotel names
    priceMin: query.priceMin ? parseFloat(query.priceMin) : null,
    priceMax: query.priceMax ? parseFloat(query.priceMax) : null,
    amenities: query.amenities || null,  // comma-separated string, matches against hotels.amenities TEXT
    sort: query.sort || 'created_at_desc',  // default: newest first
    offset,
    limit
  };

  const { hotels, total } = await hotelsRepo.findAll(filters);

  return {
    hotels,
    pagination: {
      page: parseInt(query.page) || 1,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * @function getHotelById
 * @description Gets complete details for a single hotel including rooms, amenities, images, and policies.
 * @param {number|string} hotelId - The ID of the hotel
 * @returns {Object} Complete hotel object
 */
const getHotelById = async (hotelId) => {
  // 1. Get hotel base info with location details
  const hotel = await hotelsRepo.findById(hotelId);
  if (!hotel) throw ApiError.notFound('Hotel not found');
  if (!hotel.status) throw ApiError.notFound('Hotel is not currently available');

  // 2. Get hotel images
  hotel.images = await hotelsRepo.findImagesByHotelId(hotelId);

  // 3. Get room types with their details
  hotel.rooms = await hotelsRepo.findRoomsByHotelId(hotelId);

  // 4. Get normalized amenities from hotel_amenities table
  const normalizedAmenities = await hotelsRepo.findAmenitiesByHotelId(hotelId);

  // 5. If normalized amenities exist, use them. Otherwise, parse the comma-separated amenities field.
  // Comment: backward compatibility — old hotels have amenities as comma-separated TEXT,
  // new ones use the hotel_amenities table. Support both.
  if (normalizedAmenities.length > 0) {
    hotel.amenities_list = normalizedAmenities;
  } else if (hotel.amenities) {
    hotel.amenities_list = hotel.amenities.split(',').map(a => ({ amenity_name: a.trim(), amenity_icon: null }));
  } else {
    hotel.amenities_list = [];
  }

  // 6. Get policies
  hotel.policies = await hotelsRepo.findPoliciesByHotelId(hotelId);

  return hotel;
};

/**
 * @function getHotelRooms
 * @description Retrieves rooms and their amenities/rate plans for a specific hotel.
 * @param {number|string} hotelId - The ID of the hotel
 * @returns {Array} List of room objects
 */
const getHotelRooms = async (hotelId) => {
  // Verify hotel exists
  const hotel = await hotelsRepo.findById(hotelId);
  if (!hotel) throw ApiError.notFound('Hotel not found');

  const rooms = await hotelsRepo.findRoomsByHotelId(hotelId);

  // For each room, get amenities and rate plans
  for (const room of rooms) {
    room.amenities = await hotelsRepo.findRoomAmenitiesByRoomId(room.id);
    room.rate_plans = await hotelsRepo.findRoomRatePlansByRoomId(room.id);
  }

  return rooms;
};

/**
 * @function getAvailability
 * @description Check room availability for a hotel between checkIn and checkOut dates.
 * Returns each room type with available quantity, effective price per night, and total price.
 * @param {number|string} hotelId - The ID of the hotel
 * @param {Object} query - Query params containing dates, rooms, adults
 * @returns {Array} List of available rooms with pricing
 */
const getAvailability = async (hotelId, query) => {
  const { checkIn, checkOut, rooms = 1, adults = 1 } = query;

  if (!checkIn || !checkOut) throw ApiError.badRequest('checkIn and checkOut dates are required');

  // Validate dates
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  if (checkOutDate <= checkInDate) throw ApiError.badRequest('checkOut must be after checkIn');

  // Verify hotel exists
  const hotel = await hotelsRepo.findById(hotelId);
  if (!hotel) throw ApiError.notFound('Hotel not found');

  // Get all active room types for this hotel
  const roomTypes = await hotelsRepo.findRoomsByHotelId(hotelId);
  const numRoomsNeeded = parseInt(rooms);
  const numAdults = parseInt(adults);
  const numNights = calculateNights(checkIn, checkOut);

  // Get all dates in the range (check-in inclusive, check-out exclusive)
  // Comment: a guest checking in Oct 10 and out Oct 12 stays NIGHTS of Oct 10 and Oct 11
  const dates = getDatesInRange(checkIn, checkOut);

  const availability = [];

  for (const room of roomTypes) {
    // Skip rooms that can't fit the requested adults
    // Comment: using 'capacity' field as max guests per room
    if (room.capacity < numAdults) continue;

    // Get availability records for each date
    const availabilityRecords = await hotelsRepo.findRoomAvailability(room.id, checkIn, checkOut);

    // Build a map of date → available_rooms for quick lookup
    const availMap = {};
    const priceMap = {};
    for (const rec of availabilityRecords) {
      // Format date to YYYY-MM-DD string for comparison
      const dateStr = typeof rec.date === 'string' ? rec.date.split('T')[0] : rec.date.toISOString().split('T')[0];
      availMap[dateStr] = rec.available_rooms;
      priceMap[dateStr] = rec.price_override;  // may be null
    }

    // For each night, determine available rooms
    // Comment: the MINIMUM across all nights is the bookable quantity
    // (e.g., if Oct 10 has 5 rooms and Oct 11 has 3 rooms, you can only book 3)
    let minAvailable = room.total_rooms;  // default if no availability record exists
    let totalPrice = 0;
    
    for (const date of dates) {
      let availForDate;
      if (availMap.hasOwnProperty(date)) {
        availForDate = availMap[date];
      } else {
        // No availability record = use total_rooms (full inventory)
        availForDate = room.total_rooms;
      }

      minAvailable = Math.min(minAvailable, availForDate);

      // Determine price for this night
      const nightPrice = priceMap[date] || room.price_per_night;
      totalPrice += parseFloat(nightPrice);
    }

    // Skip if not enough rooms available
    if (minAvailable < numRoomsNeeded) continue;

    // Calculate tax and total
    const pricePerNight = totalPrice / numNights;  // average if prices vary by date
    const subtotal = totalPrice * numRoomsNeeded;
    const taxAmount = parseFloat((subtotal * DEFAULT_TAX_RATE / 100).toFixed(2));
    const grandTotal = parseFloat((subtotal + taxAmount).toFixed(2));

    availability.push({
      room_id: room.id,
      room_type: room.room_type,
      capacity: room.capacity,
      room_image: room.room_image,
      available_rooms: minAvailable,
      price_per_night: parseFloat(pricePerNight.toFixed(2)),
      num_nights: numNights,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_rate: DEFAULT_TAX_RATE,
      tax_amount: taxAmount,
      total: grandTotal,
      currency: DEFAULT_CURRENCY
    });
  }

  return availability;
};

module.exports = {
  getHotels,
  getHotelById,
  getHotelRooms,
  getAvailability
};
