/**
 * @fileoverview Auth controller for handling authentication endpoints.
 */

const authService = require('./auth.service');
const catchAsync = require('../../utils/catchAsync');

/**
 * Handle user registration
 */
exports.register = catchAsync(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    data: { user }
  });
});

/**
 * Handle user login
 */
exports.login = catchAsync(async (req, res) => {
  const { token, user } = await authService.login(req.body);
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { token, user }
  });
});

/**
 * Verify user email via token
 */
exports.verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.body);
  res.status(200).json({
    success: true,
    message: 'Email verified successfully. You can now login.',
    data: null
  });
});

/**
 * Resend verification email
 */
exports.resendVerification = catchAsync(async (req, res) => {
  const { message } = await authService.resendVerification(req.body);
  // Comment: same message regardless of whether email exists (prevent user enumeration)
  res.status(200).json({
    success: true,
    message,
    data: null
  });
});

/**
 * Request password reset
 */
exports.forgotPassword = catchAsync(async (req, res) => {
  const { message } = await authService.forgotPassword(req.body);
  // Comment: same anti-enumeration message
  res.status(200).json({
    success: true,
    message,
    data: null
  });
});

/**
 * Complete password reset with token
 */
exports.resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body);
  res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now login with your new password.',
    data: null
  });
});

/**
 * Logout user
 */
exports.logout = catchAsync(async (req, res) => {
  // Comment: JWT is stateless, logout is handled client-side by discarding token. This endpoint exists for completeness.
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: null
  });
});
