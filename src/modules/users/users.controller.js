/**
 * @fileoverview Users controller for handling API requests and sending responses.
 */

const usersService = require('./users.service');
const catchAsync = require('../../utils/catchAsync');

/**
 * Get current user profile
 */
exports.getProfile = catchAsync(async (req, res) => {
  const user = await usersService.getProfile(req.user.id);
  res.status(200).json({
    success: true,
    message: 'Profile fetched successfully',
    data: { user }
  });
});

/**
 * Update current user profile
 */
exports.updateProfile = catchAsync(async (req, res) => {
  const updatedUser = await usersService.updateProfile(req.user.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: updatedUser }
  });
});
