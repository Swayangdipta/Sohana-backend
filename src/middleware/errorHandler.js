/**
 * Global Error Handler Middleware.
 * Catches all errors thrown in the application and formats them into a standard JSON response.
 * We don't expose internal error details in production to prevent leaking sensitive information.
 */
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  // Always log the full error for debugging on the server
  console.error(err);

  // If the error is an operational ApiError that we threw intentionally
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
  }

  // Handle specific JWT errors that might not have been caught by the auth middleware
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token has expired. Please login again.'
    });
  }

  // Handle MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry detected. This resource already exists.'
    });
  }

  // For unknown/programming errors
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(500).json({
    success: false,
    message: isProduction ? 'Something went wrong' : err.message,
    // Include stack trace only in development
    ...(isProduction ? {} : { stack: err.stack })
  });
};

module.exports = errorHandler;
