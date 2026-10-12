/**
 * @file hotels.controller.js
 * @description Thin controller for handling incoming HTTP requests for hotels, passing data to the service layer.
 */

const catchAsync = require('../../utils/catchAsync');
const hotelsService = require('./hotels.service');

/**
 * @function getHotels
 * @description Retrieves a paginated list of hotels based on search criteria.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getHotels = catchAsync(async (req, res) => {
  // Extract and pass query params to service
  const result = await hotelsService.getHotels(req.query);
  res.json({ success: true, message: 'Hotels retrieved successfully', data: result });
});

/**
 * @function getHotelById
 * @description Retrieves detailed information for a specific hotel.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getHotelById = catchAsync(async (req, res) => {
  const hotel = await hotelsService.getHotelById(req.params.id);
  res.json({ success: true, message: 'Hotel details retrieved successfully', data: { hotel } });
});

/**
 * @function getHotelRooms
 * @description Retrieves all active rooms for a given hotel.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getHotelRooms = catchAsync(async (req, res) => {
  const rooms = await hotelsService.getHotelRooms(req.params.id);
  res.json({ success: true, message: 'Hotel rooms retrieved successfully', data: { rooms } });
});

/**
 * @function getAvailability
 * @description Checks room availability for a hotel between specific dates.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAvailability = catchAsync(async (req, res) => {
  const availability = await hotelsService.getAvailability(req.params.id, req.query);
  res.json({ success: true, message: 'Room availability retrieved successfully', data: { availability } });
});

module.exports = {
  getHotels,
  getHotelById,
  getHotelRooms,
  getAvailability
};
