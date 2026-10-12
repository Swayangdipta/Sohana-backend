/**
 * @file locations.repository.js
 * @description Data access layer for location entities.
 */

const pool = require('../../config/database');

/**
 * @function findAll
 * @description Gets all locations with their parent cities, states, and active hotel counts.
 * @returns {Array} List of all locations joined with city and state data.
 */
const findAll = async () => {
  const sql = `
    SELECT l.id as location_id, l.location_name, l.pincode,
      c.id as city_id, c.city_name,
      s.id as state_id, s.state_name,
      (SELECT COUNT(*) FROM hotels h WHERE h.location_id = l.id AND h.status = 1) as hotel_count
    FROM locations l
    JOIN cities c ON l.city_id = c.id
    JOIN states s ON l.state_id = s.id
    ORDER BY s.state_name, c.city_name, l.location_name
  `;
  const [rows] = await pool.query(sql);
  return rows;
};

/**
 * @function search
 * @description Search across all location levels (state, city, location) returning unified results.
 * @param {string} query - Search term
 * @returns {Array} Unified list of matching locations
 */
const search = async (query) => {
  /**
   * Search across all location levels.
   * Returns a unified list with type indicator.
   * Uses UNION to combine results from states, cities, and locations.
   */
  const sql = `
    (SELECT 'state' as type, s.id, s.state_name as name, NULL as parent_name,
      (SELECT COUNT(*) FROM hotels h WHERE h.state_id = s.id AND h.status = 1) as hotel_count
    FROM states s WHERE s.state_name LIKE ?)
    UNION
    (SELECT 'city' as type, c.id, c.city_name as name, s.state_name as parent_name,
      (SELECT COUNT(*) FROM hotels h WHERE h.city_id = c.id AND h.status = 1) as hotel_count
    FROM cities c JOIN states s ON c.state_id = s.id WHERE c.city_name LIKE ?)
    UNION
    (SELECT 'location' as type, l.id, l.location_name as name, c.city_name as parent_name,
      (SELECT COUNT(*) FROM hotels h WHERE h.location_id = l.id AND h.status = 1) as hotel_count
    FROM locations l JOIN cities c ON l.city_id = c.id WHERE l.location_name LIKE ?)
    LIMIT 20
  `;
  
  const searchParam = `%${query}%`;
  const [rows] = await pool.query(sql, [searchParam, searchParam, searchParam]);
  return rows;
};

module.exports = {
  findAll,
  search
};
