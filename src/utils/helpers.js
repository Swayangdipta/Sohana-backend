const crypto = require('crypto');

/**
 * Utility functions for common operations across the application.
 */
module.exports = {
  /**
   * Generates a unique, human-readable booking reference.
   * Format: HTL-YYYYMMDD-XXXXXX (where X is uppercase alphanumeric)
   * Human-readable references matter for customer communication and support.
   * @returns {string} The formatted booking reference.
   */
  generateBookingReference: () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `HTL-${dateStr}-${randomStr}`;
  },

  /**
   * Generates a random secure token.
   * Used for email verification, password reset tokens, etc.
   * @returns {string} 64-character hex string.
   */
  generateRandomToken: () => {
    return crypto.randomBytes(32).toString('hex');
  },

  /**
   * Formats a number as currency for display purposes in emails/responses.
   * @param {number} amount - The amount to format.
   * @param {string} [currency='INR'] - The currency code.
   * @returns {string} The formatted currency string.
   */
  formatCurrency: (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  /**
   * Calculates the number of nights between two dates.
   * Note: The check-out date is NOT counted as a staying night.
   * @param {string|Date} checkIn - The check-in date.
   * @param {string|Date} checkOut - The check-out date.
   * @returns {number} Number of nights.
   */
  calculateNights: (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    // Calculate difference in milliseconds and convert to days
    return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  },

  /**
   * Normalizes pagination parameters for SQL queries.
   * @param {number} [page=1] - The current page.
   * @param {number} [limit=10] - Number of items per page.
   * @returns {Object} Object containing offset and limit.
   */
  paginate: (page = 1, limit = 10) => {
    const parsedPage = parseInt(page, 10) || 1;
    let parsedLimit = parseInt(limit, 10) || 10;
    
    // Cap limit at 50 to avoid overwhelming the database
    if (parsedLimit > 50) parsedLimit = 50;
    
    const offset = (parsedPage - 1) * parsedLimit;
    return { offset, limit: parsedLimit };
  },

  /**
   * Returns an array of date strings between start (inclusive) and end (exclusive).
   * Used for room availability — we need to check or lock each individual night's availability.
   * @param {string|Date} startDate - The start date.
   * @param {string|Date} endDate - The end date.
   * @returns {string[]} Array of date strings in YYYY-MM-DD format.
   */
  getDatesInRange: (startDate, endDate) => {
    const dates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current < end) {
      dates.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }
};
