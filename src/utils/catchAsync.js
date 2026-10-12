/**
 * Wrapper for async route handlers.
 * This avoids having to write a try-catch block in every single controller function.
 * If the promise resolves, great. If it rejects, the error is caught and passed to the next() middleware (the error handler).
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
