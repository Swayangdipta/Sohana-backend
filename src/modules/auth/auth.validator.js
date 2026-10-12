/**
 * @fileoverview Joi validation schemas for auth module
 */

const Joi = require('joi');

exports.register = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().lowercase().trim().required(),
    // Comment: Indian mobile numbers start with 6-9, exactly 10 digits
    mobile: Joi.string().pattern(/^[6-9]\d{9}$/).optional().allow('', null),
    // Comment: min 8 chars, max 128 to prevent bcrypt DoS with extremely long passwords
    password: Joi.string().min(8).max(128).required()
  })
};

exports.login = {
  body: Joi.object({
    email: Joi.string().email().lowercase().trim().optional(),
    mobile: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
    password: Joi.string().required()
  }).or('email', 'mobile') // Comment: users can login with either email or mobile
};

exports.verifyEmail = {
  body: Joi.object({
    token: Joi.string().required()
  })
};

exports.resendVerification = {
  body: Joi.object({
    email: Joi.string().email().lowercase().trim().required()
  })
};

exports.forgotPassword = {
  body: Joi.object({
    email: Joi.string().email().lowercase().trim().required()
  })
};

exports.resetPassword = {
  body: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).max(128).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({ 'any.only': 'Passwords do not match' })
  })
};
