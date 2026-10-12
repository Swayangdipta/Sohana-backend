/**
 * Main application setup file.
 * Configures Express application, middleware, and routes.
 */
// dotenv is loaded here so it's available before any config files are imported
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

const app = express();

// Apply middleware in specific order (order matters!)

// 1. helmet() — security headers to protect from well-known web vulnerabilities
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allows loading local images in dev
}));

// 2. cors() — cross-origin requests, allowing the frontend to communicate with this API
app.use(cors());

// 3. express.json() — parse incoming JSON payloads (with 10mb limit for large requests)
app.use(express.json({ limit: '10mb' }));

// 4. express.urlencoded() — parse URL-encoded bodies (form data)
app.use(express.urlencoded({ extended: true }));

// 5. morgan('dev') — HTTP request logging, highly useful in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// 6. generalLimiter — basic rate limiting for all routes
app.use(generalLimiter);

// Serve static uploads (e.g., hotel images, user avatars)
// The path is relative to the project root
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// Register API route modules
// Each module handles its own sub-routes (see modules/{name}/{name}.routes.js)
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/users/users.routes'));
app.use('/api/hotels', require('./modules/hotels/hotels.routes'));
app.use('/api/locations', require('./modules/locations/locations.routes'));
app.use('/api/bookings', require('./modules/bookings/bookings.routes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hotel Booking API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for unknown routes
app.use((req, res, next) => {
  next(ApiError.notFound('Route not found'));
});

// Error handler middleware must be the last middleware added
app.use(errorHandler);

module.exports = app;
