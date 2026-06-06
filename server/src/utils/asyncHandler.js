/**
 * Wraps async route handlers to eliminate try/catch boilerplate.
 * Any thrown error is forwarded to Express global error handler.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
