const { verifyToken } = require('../utils/generateToken');
const { error } = require('../utils/apiResponse');
const prisma = require('../config/prisma');

/**
 * Middleware: Verify JWT access token and attach user to req
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'No token provided', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token, process.env.ACCESS_TOKEN_SECRET);

    // Confirm user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, isActive: true, vendor: { select: { id: true } } },
    });

    if (!user || !user.isActive) {
      return error(res, 'User not found or deactivated', 401, 'UNAUTHORIZED');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token expired', 401, 'TOKEN_EXPIRED');
    }
    return error(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }
};

module.exports = { authenticate };
