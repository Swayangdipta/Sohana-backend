/**
 * @file locations.controller.js
 * @description Thin controller for location endpoints.
 */

const catchAsync = require('../../utils/catchAsync');
const locationsService = require('./locations.service');

/**
 * @function getLocations
 * @description Retrieves all locations grouped hierarchically.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getLocations = catchAsync(async (req, res) => {
  const data = await locationsService.getLocations();
  res.json({ success: true, message: 'Locations retrieved successfully', data });
});

/**
 * @function searchLocations
 * @description Searches locations by query string.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const searchLocations = catchAsync(async (req, res) => {
  const data = await locationsService.searchLocations(req.query.q);
  res.json({ success: true, message: 'Location search completed', data });
});

module.exports = {
  getLocations,
  searchLocations
};
