/**
 * Bookings Routes
 * 
 * Defines all API endpoints related to hotel bookings.
 * 
 * Design Decisions:
 * - All endpoints require authentication (auth middleware)
 * - Input validation is performed before reaching the controller
 * - Structured in a RESTful manner
 */

const express = require('express');
const router = express.Router();

const auth = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const bookingsController = require('./bookings.controller');
const validators = require('./bookings.validator');

// All booking operations require authentication
router.use(auth);

/**
 * @route POST /api/bookings
 * @desc Create a new hotel booking
 * @access Private
 */
router.post('/', validate(validators.createBooking), bookingsController.createBooking);

/**
 * @route GET /api/bookings
 * @desc Get all bookings for the authenticated user
 * @access Private
 */
router.get('/', bookingsController.getBookings);

/**
 * @route GET /api/bookings/:id
 * @desc Get detailed information about a specific booking
 * @access Private
 */
router.get('/:id', bookingsController.getBookingById);

/**
 * @route POST /api/bookings/:id/cancel
 * @desc Cancel an existing booking
 * @access Private
 */
router.post('/:id/cancel', validate(validators.cancelBooking), bookingsController.cancelBooking);

module.exports = router;
