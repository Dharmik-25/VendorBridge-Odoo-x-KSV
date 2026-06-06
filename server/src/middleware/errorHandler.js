const { error } = require('../utils/apiResponse');

/**
 * Express Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const details = err.details || null;

  return error(res, message, statusCode, code, details);
};

module.exports = { errorHandler };
