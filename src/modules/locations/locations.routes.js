/**
 * @file locations.routes.js
 * @description Express routes for the Locations module.
 * Provides public endpoints to fetch and search locations.
 */

const express = require('express');
const router = express.Router();
const locationsController = require('./locations.controller');

// Comment: location APIs are public for search/browse without login
router.get('/', locationsController.getLocations);
router.get('/search', locationsController.searchLocations);

module.exports = router;
