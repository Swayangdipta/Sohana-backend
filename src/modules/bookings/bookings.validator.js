/**
 * Bookings Validator
 * 
 * Defines Joi validation schemas for booking-related requests.
 * These schemas are used by the validate middleware to ensure data integrity
 * before requests reach the controller layer.
 */

const Joi = require('joi');

const createBooking = {
  body: Joi.object({
    hotel_id: Joi.number().integer().positive().required(),
    room_id: Joi.number().integer().positive().required(),
    // Comment: must be today or later (compare date-only to avoid UTC timezone issues)
    // Using IST (UTC+5:30) for "today" since this is an India-only platform
    check_in: Joi.date().iso().required().custom((value, helpers) => {
      // Get today's date in IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in ms
      const istNow = new Date(now.getTime() + istOffset);
      const todayIST = istNow.toISOString().split('T')[0]; // 'YYYY-MM-DD'
      const checkInDate = new Date(value).toISOString().split('T')[0];
      if (checkInDate < todayIST) {
        return helpers.error('date.min', { limit: 'today' });
      }
      return value;
    }),
    // Comment: must be after check_in
    check_out: Joi.date().iso().greater(Joi.ref('check_in')).required(),
    num_rooms: Joi.number().integer().min(1).max(10).required(),
    num_adults: Joi.number().integer().min(1).max(20).required(),
    num_children: Joi.number().integer().min(0).max(10).default(0),
    contact_name: Joi.string().trim().min(2).max(100).required(),
    contact_email: Joi.string().email().required(),
    // Comment: Indian mobile format
    contact_phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    special_requests: Joi.string().max(500).optional().allow('', null),
    // Comment: at least one guest is required
    guests: Joi.array().items(
      Joi.object({
        first_name: Joi.string().trim().min(1).max(50).required(),
        last_name: Joi.string().trim().max(50).optional().allow('', null),
        age: Joi.number().integer().min(0).max(150).optional(),
        gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').optional(),
        guest_type: Joi.string().valid('ADULT', 'CHILD').required(),
        is_primary: Joi.boolean().optional().default(false),
        email: Joi.string().email().optional().allow('', null),
        phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional().allow('', null)
      })
    ).min(1).required()
  })
};

const cancelBooking = {
  body: Joi.object({
    reason: Joi.string().max(500).optional().allow('', null)
  })
};

module.exports = {
  createBooking,
  cancelBooking
};
