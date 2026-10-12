/**
 * Rate Limiting Middleware.
 * Protects the API from brute-force attacks and abuse by limiting the number 
 * of requests a single IP address can make within a specific time window.
 */
const rateLimit = require('express-rate-limit');

// Custom message for rate limit errors
const rateLimitMessage = { 
  success: false, 
  message: 'Too many requests, please try again later.' 
};

// General rate limiter applied to all routes
// Standard protection: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: rateLimitMessage
});

// Stricter rate limiter for authentication routes (login, register, forgot password)
// Brute force protection: 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage
});

// Moderate rate limiter for specific API endpoints (e.g. searching, booking)
// 60 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage
});

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter
};
