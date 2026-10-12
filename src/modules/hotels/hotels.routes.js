/**
 * @file hotels.routes.js
 * @description Express routes for the Hotels module. Maps endpoints to controller functions for browsing and searching hotels.
 */

const express = require('express');
const router = express.Router();
const hotelsController = require('./hotels.controller');

// Comment: All hotel routes are public — guests browse without logging in
router.get('/', hotelsController.getHotels);
router.get('/:id', hotelsController.getHotelById);
router.get('/:id/rooms', hotelsController.getHotelRooms);
router.get('/:id/availability', hotelsController.getAvailability);

module.exports = router;
