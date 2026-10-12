/**
 * @fileoverview Users repository layer for handling all database interactions for the users table.
 * Uses parameterized queries to prevent SQL injection.
 */

const pool = require('../../config/database');

/**
 * Find a user by their ID, excluding the password field.
 * @param {number|string} id - The user ID
 * @returns {Promise<Object|null>} The user object or null if not found
 */
exports.findById = async (id) => {
  // Comment: never SELECT password unless specifically needed for auth
  const [rows] = await pool.query(
    `SELECT id, name, email, mobile, email_verified, email_verified_at, 
            mobile_verified, mobile_verified_at, status, role, 
            last_login_at, created_at, updated_at 
     FROM users WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Find a user by their ID, including the password field.
 * @param {number|string} id - The user ID
 * @returns {Promise<Object|null>} The user object or null if not found
 */
exports.findByIdWithPassword = async (id) => {
  // Comment: only used internally by auth service
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
};

/**
 * Find a user by their email address.
 * @param {string} email - The user's email
 * @returns {Promise<Object|null>} The user object or null if not found
 */
exports.findByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
};

/**
 * Find a user by their mobile number.
 * @param {string} mobile - The user's mobile number
 * @returns {Promise<Object|null>} The user object or null if not found
 */
exports.findByMobile = async (mobile) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE mobile = ?', [mobile]);
  return rows[0] || null;
};

/**
 * Create a new user in the database.
 * @param {Object} userData - User registration data
 * @returns {Promise<number>} The ID of the newly created user
 */
exports.create = async (userData) => {
  const { name, email, mobile, password, role } = userData;
  // Use parameterized query for safety
  const [result] = await pool.query(
    'INSERT INTO users (name, email, mobile, password, role) VALUES (?, ?, ?, ?, ?)',
    [name, email, mobile, password, role || 'USER']
  );
  return result.insertId;
};

/**
 * Update user fields dynamically based on provided data.
 * @param {number|string} id - The user ID
 * @param {Object} data - Fields to update
 * @returns {Promise<void>}
 */
exports.update = async (id, data) => {
  if (!data || Object.keys(data).length === 0) return;

  // Comment: build the SET clause dynamically to only update provided fields
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }

  values.push(id);
  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  
  await pool.query(query, values);
};

/**
 * Update a user's password.
 * @param {number|string} id - The user ID
 * @param {string} hashedPassword - The newly hashed password
 * @returns {Promise<void>}
 */
exports.updatePassword = async (id, hashedPassword) => {
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
};

/**
 * Mark a user's email as verified.
 * @param {number|string} id - The user ID
 * @returns {Promise<void>}
 */
exports.updateEmailVerified = async (id) => {
  await pool.query('UPDATE users SET email_verified = 1, email_verified_at = NOW() WHERE id = ?', [id]);
};

/**
 * Update the last login timestamp for a user.
 * @param {number|string} id - The user ID
 * @returns {Promise<void>}
 */
exports.updateLastLogin = async (id) => {
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id]);
};
