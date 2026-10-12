/**
 * @fileoverview Auth service layer for authentication business logic.
 */

const pool = require('../../config/database');
const usersRepo = require('../users/users.repository');
const ApiError = require('../../utils/ApiError');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../../config/jwt');
const { USER_STATUS, BCRYPT_SALT_ROUNDS, VERIFICATION_TOKEN_EXPIRY_HOURS, PASSWORD_RESET_TOKEN_EXPIRY_HOURS } = require('../../utils/constants');
const { generateRandomToken } = require('../../utils/helpers');
const { hashToken } = require('../../utils/crypto');
const emailService = require('../notifications/email.service');

/**
 * Register a new user
 * @param {Object} data - User registration data
 * @returns {Promise<Object>} The registered user object without password
 */
exports.register = async (data) => {
  // 1. Check if email already registered
  const existingEmail = await usersRepo.findByEmail(data.email);
  if (existingEmail) throw ApiError.conflict('An account with this email already exists');
  
  // 2. Check if mobile already registered (if provided)
  if (data.mobile) {
    const existingMobile = await usersRepo.findByMobile(data.mobile);
    if (existingMobile) throw ApiError.conflict('An account with this mobile number already exists');
  }
  
  // 3. Hash password with bcrypt
  // Comment: 12 salt rounds — good balance of security vs performance (~250ms per hash)
  const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);
  
  // 4. Create user with email_verified = 0
  const userId = await usersRepo.create({ ...data, password: hashedPassword });
  
  // 5. Generate verification token and store hash
  // Comment: we store SHA-256 hash of token in DB, send raw token via email
  // Even if DB is breached, attacker can't verify accounts
  const rawToken = generateRandomToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  
  await pool.query(
    'INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]
  );
  
  // 6. Send verification email (don't await — fire and forget, don't block registration)
  // Comment: email sending is non-blocking. If it fails, user can resend.
  const user = await usersRepo.findById(userId);
  emailService.sendVerificationEmail(user, rawToken).catch(err => console.error('Failed to send verification email:', err));
  
  // 7. Return user data without password
  delete user.password;
  return user;
};

/**
 * Authenticate a user
 * @param {Object} data - Login data
 * @returns {Promise<Object>} Token and user info
 */
exports.login = async (data) => {
  // 1. Find user by email OR mobile (support both login methods)
  let user = null;
  if (data.email) {
    user = await usersRepo.findByEmail(data.email);
  } else if (data.mobile) {
    user = await usersRepo.findByMobile(data.mobile);
  }
  
  // Comment: generic error message — don't reveal whether email/mobile exists
  if (!user) throw ApiError.unauthorized('Invalid email/mobile or password');
  
  // 2. Compare password
  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) throw ApiError.unauthorized('Invalid email/mobile or password');
  
  // 3. Check email verification — MUST be verified to login
  // Comment: this is a business requirement — unverified accounts cannot access the platform
  if (!user.email_verified) {
    throw ApiError.forbidden('Please verify your email address before logging in. Check your inbox for the verification link.');
  }
  
  // 4. Check account status
  if (user.status !== USER_STATUS.ACTIVE) {
    throw ApiError.forbidden('Your account has been suspended or deactivated. Please contact support.');
  }
  
  // 5. Update last login timestamp
  await usersRepo.updateLastLogin(user.id);
  
  // 6. Generate JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
  
  // 7. Return token and user (without password)
  delete user.password;
  return { token, user };
};

/**
 * Verify user email
 * @param {Object} data - Verification data with token
 * @returns {Promise<Object>} Success message
 */
exports.verifyEmail = async ({ token }) => {
  // 1. Hash the submitted token to find it in DB
  const tokenHash = hashToken(token);
  
  // 2. Find valid (unused, not expired) token
  const [rows] = await pool.query(
    'SELECT * FROM email_verification_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()',
    [tokenHash]
  );
  if (rows.length === 0) throw ApiError.badRequest('Invalid or expired verification token');
  
  const tokenRecord = rows[0];
  
  // 3. Mark token as used (prevents reuse)
  await pool.query('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ?', [tokenRecord.id]);
  
  // 4. Verify the user's email
  await usersRepo.updateEmailVerified(tokenRecord.user_id);
  
  return { message: 'Email verified successfully' };
};

/**
 * Resend verification email
 * @param {Object} data - Contains user email
 * @returns {Promise<Object>} Status message
 */
exports.resendVerification = async ({ email }) => {
  // Comment: always return success message regardless of whether user exists (anti-enumeration)
  const user = await usersRepo.findByEmail(email);
  if (!user) return { message: 'If an account exists with this email, a verification link has been sent.' };
  
  if (user.email_verified) throw ApiError.badRequest('This email address is already verified');
  
  // Generate new token
  const rawToken = generateRandomToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  
  await pool.query(
    'INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [user.id, tokenHash, expiresAt]
  );
  
  emailService.sendVerificationEmail(user, rawToken).catch(err => console.error('Failed to send verification email:', err));
  
  return { message: 'If an account exists with this email, a verification link has been sent.' };
};

/**
 * Request password reset
 * @param {Object} data - Contains user email
 * @returns {Promise<Object>} Status message
 */
exports.forgotPassword = async ({ email }) => {
  // Comment: anti-enumeration — same response whether or not the email exists
  const user = await usersRepo.findByEmail(email);
  if (!user) return { message: 'If an account exists with this email, a password reset link has been sent.' };
  
  const rawToken = generateRandomToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  
  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [user.id, tokenHash, expiresAt]
  );
  
  emailService.sendPasswordResetEmail(user, rawToken).catch(err => console.error('Failed to send password reset email:', err));
  
  return { message: 'If an account exists with this email, a password reset link has been sent.' };
};

/**
 * Reset password
 * @param {Object} data - Reset data with token and new password
 * @returns {Promise<Object>} Status message
 */
exports.resetPassword = async ({ token, password }) => {
  const tokenHash = hashToken(token);
  
  const [rows] = await pool.query(
    'SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()',
    [tokenHash]
  );
  if (rows.length === 0) throw ApiError.badRequest('Invalid or expired reset token');
  
  const tokenRecord = rows[0];
  
  // Hash new password
  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  
  // Update password and mark token as used
  await usersRepo.updatePassword(tokenRecord.user_id, hashedPassword);
  await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [tokenRecord.id]);
  
  // Invalidate all other unused reset tokens for this user (security best practice)
  await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL', [tokenRecord.user_id]);
  
  return { message: 'Password reset successful' };
};
