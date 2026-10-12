/**
 * Application constants.
 * Centralizing these values prevents magic strings/numbers and makes refactoring easier.
 */

// Booking statuses
// PENDING = awaiting confirmation, CONFIRMED = pay-at-hotel confirmed, etc.
const BOOKING_STATUS = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED'
});

// Payment statuses
// Separate from booking status — a booking can be CONFIRMED but payment PENDING (e.g. pay at hotel)
const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PAY_AT_HOTEL: 'PAY_AT_HOTEL',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED'
});

// Payment methods
// Currently only PAY_AT_HOTEL is active, others reserved for future payment gateway integrations
const PAYMENT_METHOD = Object.freeze({
  PAY_AT_HOTEL: 'PAY_AT_HOTEL',
  ONLINE: 'ONLINE',
  UPI: 'UPI',
  CARD: 'CARD',
  NET_BANKING: 'NET_BANKING'
});

// User roles
// Currently only CUSTOMER is used, others for future admin panel features
const USER_ROLES = Object.freeze({
  CUSTOMER: 'CUSTOMER',
  HOTEL_ADMIN: 'HOTEL_ADMIN',
  STAFF: 'STAFF',
  SUPER_ADMIN: 'SUPER_ADMIN'
});

// User statuses
const USER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED'
});

// Cancellation request statuses
const CANCELLATION_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
});

// Default GST rate applied to room bookings, can be overridden per room type in the future
const DEFAULT_TAX_RATE = 12.00;

// Default currency for the application
const DEFAULT_CURRENCY = 'INR';

// Token expiration times in hours
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;

// 12 rounds provides a good security/performance balance for bcrypt
const BCRYPT_SALT_ROUNDS = 12;

module.exports = {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  USER_ROLES,
  USER_STATUS,
  CANCELLATION_STATUS,
  DEFAULT_TAX_RATE,
  DEFAULT_CURRENCY,
  VERIFICATION_TOKEN_EXPIRY_HOURS,
  PASSWORD_RESET_TOKEN_EXPIRY_HOURS,
  BCRYPT_SALT_ROUNDS
};
