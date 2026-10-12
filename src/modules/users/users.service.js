/**
 * @fileoverview Users service layer for business logic.
 */

const usersRepo = require('./users.repository');
const ApiError = require('../../utils/ApiError');

/**
 * Get user profile by ID.
 * @param {number|string} userId - The user ID
 * @returns {Promise<Object>} User profile object
 */
exports.getProfile = async (userId) => {
  const user = await usersRepo.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
};

/**
 * Update user profile.
 * @param {number|string} userId - The user ID
 * @param {Object} data - Update data (name, mobile)
 * @returns {Promise<Object>} Updated user profile object
 */
exports.updateProfile = async (userId, data) => {
  // Check if mobile is being updated and not taken by someone else
  if (data.mobile) {
    const existingMobile = await usersRepo.findByMobile(data.mobile);
    if (existingMobile && String(existingMobile.id) !== String(userId)) {
      throw ApiError.conflict('An account with this mobile number already exists');
    }
  }

  // Update allowed fields
  const allowedUpdates = {};
  if (data.name !== undefined) allowedUpdates.name = data.name;
  if (data.mobile !== undefined) allowedUpdates.mobile = data.mobile;

  if (Object.keys(allowedUpdates).length > 0) {
    await usersRepo.update(userId, allowedUpdates);
  }

  // Return the updated user
  return this.getProfile(userId);
};
