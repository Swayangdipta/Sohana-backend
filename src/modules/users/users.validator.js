/**
 * @fileoverview Joi validation schemas for users module
 */

const Joi = require('joi');

/**
 * Validation schema for updating user profile
 */
exports.updateProfile = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    mobile: Joi.string().pattern(/^[6-9]\d{9}$/).optional().allow('', null)
  })
};
