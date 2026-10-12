/**
 * Authentication middleware.
 * Implements a stateless JWT authentication approach.
 * Instead of maintaining session state on the server, we verify the signature
 * of the provided JWT on each request to identify the user.
 */
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const ApiError = require('../utils/ApiError');

const auth = (req, res, next) => {
  try {
    // 1. Extract token from 'Authorization: Bearer <token>' header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 2. If no token found
      throw ApiError.unauthorized('Authentication required. Please provide a valid token.');
    }

    const token = authHeader.split(' ')[1];

    // 3. Verify JWT using jwt.verify()
    const decoded = jwt.verify(token, jwtConfig.secret);

    // 4. Set req.user to the decoded payload
    req.user = decoded;

    // 5. Call next() to pass control to the next middleware/route handler
    next();
  } catch (error) {
    // 6 & 7. Handle specific JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized('Token has expired. Please login again.'));
    } else {
      next(error);
    }
  }
};

module.exports = auth;
