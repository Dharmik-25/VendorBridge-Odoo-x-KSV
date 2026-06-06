const jwt = require('jsonwebtoken');

/**
 * Generate short-lived access token (15 min)
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  });
};

/**
 * Generate long-lived refresh token (7 days)
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  });
};

/**
 * Verify any JWT token
 */
const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

module.exports = { generateAccessToken, generateRefreshToken, verifyToken };
