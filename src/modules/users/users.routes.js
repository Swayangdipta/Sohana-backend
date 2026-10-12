/**
 * @fileoverview Routes definition for the users module.
 */

const express = require('express');
const router = express.Router();

const controller = require('./users.controller');
const validators = require('./users.validator');
const validate = require('../../middleware/validate');
const auth = require('../../middleware/auth');

// Comment: /me routes use the JWT token to identify the user — no user ID in the URL
router.get('/me', auth, controller.getProfile);
router.patch('/me', auth, validate(validators.updateProfile), controller.updateProfile);

module.exports = router;
