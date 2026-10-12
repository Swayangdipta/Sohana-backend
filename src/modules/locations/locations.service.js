/**
 * @file locations.service.js
 * @description Business logic layer for location features.
 */

const locationsRepo = require('./locations.repository');
const ApiError = require('../../utils/ApiError');

/**
 * @function getLocations
 * @description Returns all locations in a hierarchical structure. This powers the location browser/dropdown in the frontend.
 * @returns {Array} Hierarchical list of states, containing cities, containing locations.
 */
const getLocations = async () => {
  const allLocations = await locationsRepo.findAll();
  
  // Use a Map to build the hierarchy efficiently
  // Comment: Grouping logic: Create state maps, then city maps, and populate locations under cities.
  const stateMap = new Map();

  for (const loc of allLocations) {
    if (!stateMap.has(loc.state_id)) {
      stateMap.set(loc.state_id, {
        id: loc.state_id,
        state_name: loc.state_name,
        cities: new Map()
      });
    }

    const state = stateMap.get(loc.state_id);

    if (!state.cities.has(loc.city_id)) {
      state.cities.set(loc.city_id, {
        id: loc.city_id,
        city_name: loc.city_name,
        locations: [],
        hotel_count: 0
      });
    }

    const city = state.cities.get(loc.city_id);
    city.locations.push({
      id: loc.location_id,
      location_name: loc.location_name,
      pincode: loc.pincode,
      hotel_count: loc.hotel_count
    });
    
    // Accumulate total hotel count for the city
    city.hotel_count += loc.hotel_count;
  }

  // Convert nested Maps back to Arrays
  const result = Array.from(stateMap.values()).map(state => ({
    id: state.id,
    state_name: state.state_name,
    cities: Array.from(state.cities.values())
  }));

  return result;
};

/**
 * @function searchLocations
 * @description Searches across states, cities, and locations for autocomplete UI.
 * @param {string} query - The search query
 * @returns {Array} List of location matches with type indicator
 */
const searchLocations = async (query) => {
  // Searches across states, cities, and locations.
  // Returns results with type indicator and hotel count.
  // Useful for autocomplete/typeahead in the search bar.
  if (!query || query.length < 2) {
    throw ApiError.badRequest('Search query must be at least 2 characters');
  }

  const results = await locationsRepo.search(query);
  return results;
};

module.exports = {
  getLocations,
  searchLocations
};
