const { error } = require('../utils/apiResponse');

/**
 * Middleware: Check if req.user has one of the allowed roles
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return error(res, 'Access denied. Insufficient permissions', 403, 'FORBIDDEN');
    }

    next();
  };
};

module.exports = authorize;
