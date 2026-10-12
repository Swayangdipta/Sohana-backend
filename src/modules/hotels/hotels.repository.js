/**
 * @file hotels.repository.js
 * @description Data access layer for Hotels. Executes SQL queries.
 */

const pool = require('../../config/database');

/**
 * @function findAll
 * @description Complex search query with dynamic WHERE clauses. Uses parameterized queries throughout.
 * @param {Object} filters - Search filters including pagination
 * @returns {Object} Object containing hotels array and total count
 */
const findAll = async (filters) => {
  let queryParams = [];
  let whereClauses = ['h.status = 1'];

  // Dynamic WHERE conditions (add if filter value present)
  if (filters.destination) {
    whereClauses.push('(c.city_name LIKE ? OR l.location_name LIKE ? OR s.state_name LIKE ? OR h.hotel_name LIKE ?)');
    const destParam = `%${filters.destination}%`;
    queryParams.push(destParam, destParam, destParam, destParam);
    // Comment: searches across all location levels and hotel name
  }

  if (filters.priceMin !== null) {
    whereClauses.push('hr.price_per_night >= ?');
    queryParams.push(filters.priceMin);
  }

  if (filters.priceMax !== null) {
    whereClauses.push('hr.price_per_night <= ?');
    queryParams.push(filters.priceMax);
  }

  if (filters.amenities) {
    whereClauses.push('h.amenities LIKE ?');
    queryParams.push(`%${filters.amenities}%`);
    // Comment: basic search in comma-separated text field. For production, use the hotel_amenities table.
  }

  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count Query for pagination
  const countSql = `
    SELECT COUNT(DISTINCT h.id) as total
    FROM hotels h
    JOIN states s ON h.state_id = s.id
    JOIN cities c ON h.city_id = c.id
    JOIN locations l ON h.location_id = l.id
    LEFT JOIN hotel_rooms hr ON h.id = hr.hotel_id AND hr.status = 1
    ${whereString}
  `;
  const [countRows] = await pool.query(countSql, queryParams);
  const total = countRows[0].total;

  // Sorting
  let orderString = 'ORDER BY h.created_at DESC';
  if (filters.sort === 'price_asc') orderString = 'ORDER BY min_price ASC';
  else if (filters.sort === 'price_desc') orderString = 'ORDER BY min_price DESC';
  else if (filters.sort === 'name_asc') orderString = 'ORDER BY h.hotel_name ASC';
  else if (filters.sort === 'name_desc') orderString = 'ORDER BY h.hotel_name DESC';

  // Base SELECT Query
  const sql = `
    SELECT h.*, 
      s.state_name, c.city_name, l.location_name, l.pincode,
      MIN(hr.price_per_night) as min_price,
      MAX(hr.price_per_night) as max_price,
      COUNT(hr.id) as room_type_count
    FROM hotels h
    JOIN states s ON h.state_id = s.id
    JOIN cities c ON h.city_id = c.id
    JOIN locations l ON h.location_id = l.id
    LEFT JOIN hotel_rooms hr ON h.id = hr.hotel_id AND hr.status = 1
    ${whereString}
    GROUP BY h.id
    ${orderString}
    LIMIT ?, ?
  `;

  const queryParamsWithPagination = [...queryParams, filters.offset, filters.limit];
  const [hotels] = await pool.query(sql, queryParamsWithPagination);

  return { hotels, total };
};

/**
 * @function findById
 * @description Fetch a specific hotel by its ID including location data.
 * @param {number|string} id - Hotel ID
 * @returns {Object|null} Hotel object or null if not found
 */
const findById = async (id) => {
  const sql = `
    SELECT h.*, s.state_name, c.city_name, l.location_name, l.pincode
    FROM hotels h
    JOIN states s ON h.state_id = s.id
    JOIN cities c ON h.city_id = c.id
    JOIN locations l ON h.location_id = l.id
    WHERE h.id = ?
  `;
  const [rows] = await pool.query(sql, [id]);
  return rows[0] || null;
};

/**
 * @function findImagesByHotelId
 * @description Gets all images for a given hotel.
 * @param {number|string} hotelId - Hotel ID
 * @returns {Array} Array of image objects
 */
const findImagesByHotelId = async (hotelId) => {
  const sql = `SELECT * FROM hotel_images WHERE hotel_id = ? ORDER BY created_at ASC`;
  const [rows] = await pool.query(sql, [hotelId]);
  return rows;
};

/**
 * @function findRoomsByHotelId
 * @description Retrieves active rooms for a hotel.
 * @param {number|string} hotelId - Hotel ID
 * @returns {Array} Array of room objects
 */
const findRoomsByHotelId = async (hotelId) => {
  const sql = `SELECT * FROM hotel_rooms WHERE hotel_id = ? AND status = 1 ORDER BY price_per_night ASC`;
  const [rows] = await pool.query(sql, [hotelId]);
  return rows;
};

/**
 * @function findAmenitiesByHotelId
 * @description Retrieves amenities from the normalized hotel_amenities table.
 * @param {number|string} hotelId - Hotel ID
 * @returns {Array} Array of amenity objects
 */
const findAmenitiesByHotelId = async (hotelId) => {
  const sql = `SELECT * FROM hotel_amenities WHERE hotel_id = ? ORDER BY amenity_name ASC`;
  const [rows] = await pool.query(sql, [hotelId]);
  return rows;
};

/**
 * @function findPoliciesByHotelId
 * @description Gets policies associated with a given hotel.
 * @param {number|string} hotelId - Hotel ID
 * @returns {Array} Array of policy objects
 */
const findPoliciesByHotelId = async (hotelId) => {
  const sql = `SELECT * FROM hotel_policies WHERE hotel_id = ? ORDER BY policy_type ASC`;
  const [rows] = await pool.query(sql, [hotelId]);
  return rows;
};

/**
 * @function findRoomAmenitiesByRoomId
 * @description Gets amenities for a specific room type.
 * @param {number|string} roomId - Room ID
 * @returns {Array} Array of room amenity objects
 */
const findRoomAmenitiesByRoomId = async (roomId) => {
  const sql = `SELECT * FROM room_amenities WHERE room_id = ?`;
  const [rows] = await pool.query(sql, [roomId]);
  return rows;
};

/**
 * @function findRoomRatePlansByRoomId
 * @description Fetch active rate plans that are currently valid.
 * @param {number|string} roomId - Room ID
 * @returns {Array} Valid room rate plans
 */
const findRoomRatePlansByRoomId = async (roomId) => {
  // Comment: only return currently valid rate plans
  const sql = `
    SELECT * FROM room_rate_plans 
    WHERE room_id = ? AND status = 1
    AND (valid_from IS NULL OR valid_from <= CURDATE())
    AND (valid_to IS NULL OR valid_to >= CURDATE())
  `;
  const [rows] = await pool.query(sql, [roomId]);
  return rows;
};

/**
 * @function findRoomAvailability
 * @description Gets room availability records for a given date range.
 * @param {number|string} roomId - Room ID
 * @param {string} checkIn - Check-in date string
 * @param {string} checkOut - Check-out date string
 * @returns {Array} Array of availability records
 */
const findRoomAvailability = async (roomId, checkIn, checkOut) => {
  // Comment: checkOut date is exclusive (last night is checkOut - 1)
  const sql = `
    SELECT * FROM room_availability
    WHERE room_id = ? AND date >= ? AND date < ?
    ORDER BY date ASC
  `;
  const [rows] = await pool.query(sql, [roomId, checkIn, checkOut]);
  return rows;
};

module.exports = {
  findAll,
  findById,
  findImagesByHotelId,
  findRoomsByHotelId,
  findAmenitiesByHotelId,
  findPoliciesByHotelId,
  findRoomAmenitiesByRoomId,
  findRoomRatePlansByRoomId,
  findRoomAvailability
};
