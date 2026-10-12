/**
 * Custom error class for API errors.
 * Operational errors (e.g., bad requests, invalid input) are expected and handled gracefully,
 * whereas programming errors (e.g., undefined variable) may cause crashes and should be fixed.
 * We use isOperational to distinguish between the two.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    // For validation error details (e.g., which fields failed)
    this.errors = errors;
    // Mark as an operational error
    this.isOperational = true;
    
    // Capture the stack trace, excluding the constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Not Found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(409, message);
  }

  static internal(message = 'Internal Server Error') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
