/**
 * Bookings Controller
 * 
 * Handles HTTP requests related to hotel bookings, delegates business logic
 * to the service layer, and formats HTTP responses.
 * 
 * Design Decisions:
 * - Uses catchAsync wrapper to handle promise rejections without try-catch blocks
 * - Extracts relevant data from req (user ID, body, params, query) and passes it to the service
 * - Standardized JSON response format: { success, message, data }
 */

const bookingsService = require('./bookings.service');
const catchAsync = require('../../utils/catchAsync');

/**
 * Create a new booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createBooking = catchAsync(async (req, res) => {
  const booking = await bookingsService.createBooking(req.user.id, req.body);
  res.status(201).json({ 
    success: true, 
    message: 'Booking created successfully', 
    data: { booking } 
  });
});

/**
 * Get all bookings for the current user (with pagination)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBookings = catchAsync(async (req, res) => {
  const result = await bookingsService.getBookings(req.user.id, req.query);
  res.json({ 
    success: true, 
    message: 'Bookings retrieved successfully', 
    data: result 
  });
});

/**
 * Get detailed view of a specific booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBookingById = catchAsync(async (req, res) => {
  const booking = await bookingsService.getBookingById(req.params.id, req.user.id);
  res.json({ 
    success: true, 
    message: 'Booking details retrieved successfully', 
    data: { booking } 
  });
});

/**
 * Cancel a specific booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const cancelBooking = catchAsync(async (req, res) => {
  const booking = await bookingsService.cancelBooking(req.params.id, req.user.id, req.body.reason);
  res.json({ 
    success: true, 
    message: 'Booking cancelled successfully', 
    data: { booking } 
  });
});

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking
};
