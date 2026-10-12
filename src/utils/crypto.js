const crypto = require('crypto');

/**
 * Cryptography utilities.
 * Handles hashing and comparing tokens for security.
 */
module.exports = {
  /**
   * Hashes a plain token using SHA-256.
   * We store hashed tokens in the DB so even if the DB is compromised, 
   * the plain tokens (which are sent via email) cannot be reused.
   * @param {string} token - The plain token to hash.
   * @returns {string} The resulting hex hash.
   */
  hashToken: (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  /**
   * Compares a plain token with a stored hashed token.
   * @param {string} plainToken - The plain token provided by the user.
   * @param {string} hashedToken - The hashed token stored in the database.
   * @returns {boolean} True if they match, false otherwise.
   */
  compareTokenHash: (plainToken, hashedToken) => {
    const hash = crypto.createHash('sha256').update(plainToken).digest('hex');
    return hash === hashedToken;
  }
};
