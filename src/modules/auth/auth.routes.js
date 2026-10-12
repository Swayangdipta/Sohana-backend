/**
 * @fileoverview Routes definition for the auth module.
 */

const express = require('express');
const router = express.Router();

const controller = require('./auth.controller');
const validators = require('./auth.validator');
const validate = require('../../middleware/validate');
const auth = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimiter');

// Comment: explain why auth limiter is on login/register (brute force protection)
// We apply rate limiting to prevent brute force attacks on credentials.
router.post('/register', authLimiter, validate(validators.register), controller.register);
router.post('/login', authLimiter, validate(validators.login), controller.login);

router.post('/verify-email', validate(validators.verifyEmail), controller.verifyEmail);
router.post('/resend-verification', validate(validators.resendVerification), controller.resendVerification);
router.post('/forgot-password', validate(validators.forgotPassword), controller.forgotPassword);
router.post('/reset-password', validate(validators.resetPassword), controller.resetPassword);
router.post('/logout', auth, controller.logout);

module.exports = router;
