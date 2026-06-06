const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/generateToken');
const { success, error } = require('../utils/apiResponse');
const { logActivity } = require('../services/activityLogService');

const SALT_ROUNDS = 12;

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return error(res, 'A user with this email already exists', 400, 'USER_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Use a transaction to ensure if they register as a vendor, we also create the vendor record linked to them
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || 'vendor',
      },
    });

    let vendor = null;
    if (user.role === 'vendor') {
      vendor = await tx.vendor.create({
        data: {
          userId: user.id,
          name: user.name,
          email: user.email,
          status: 'pending', // default pending until approved by admin
        },
      });
    }

    return { user, vendor };
  });

  await logActivity(
    result.user.id,
    'REGISTER',
    'User',
    result.user.id,
    { email: result.user.email, role: result.user.role, vendorId: result.vendor?.id },
    req.ip
  );

  const userResponse = {
    id: result.user.id,
    name: result.user.name,
    email: result.user.email,
    role: result.user.role,
    createdAt: result.user.createdAt,
    vendorId: result.vendor?.id || null,
  };

  return success(res, userResponse, 'User registered successfully', 201);
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { vendor: { select: { id: true, status: true } } },
  });

  if (!user || !user.isActive) {
    return error(res, 'Invalid email or password', 400, 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return error(res, 'Invalid email or password', 400, 'INVALID_CREDENTIALS');
  }

  // Generate tokens
  const tokenPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    vendorId: user.vendor?.id || null,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken({ id: user.id });

  // Store refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  await logActivity(
    user.id,
    'LOGIN',
    'User',
    user.id,
    { role: user.role, vendorId: user.vendor?.id || null },
    req.ip
  );

  return success(
    res,
    {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        vendorId: user.vendor?.id || null,
        vendorStatus: user.vendor?.status || null,
      },
    },
    'Login successful'
  );
};

/**
 * POST /api/auth/refresh
 */
const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return error(res, 'Refresh token is required', 400, 'BAD_REQUEST');
  }

  try {
    const decoded = verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Verify token exists in database and is not expired
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.id,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          include: {
            vendor: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!storedToken || !storedToken.user.isActive) {
      return error(res, 'Invalid or expired refresh token', 401, 'UNAUTHORIZED');
    }

    // Generate new access token
    const tokenPayload = {
      id: storedToken.user.id,
      name: storedToken.user.name,
      email: storedToken.user.email,
      role: storedToken.user.role,
      vendorId: storedToken.user.vendor?.id || null,
    };

    const accessToken = generateAccessToken(tokenPayload);

    return success(res, { accessToken }, 'Access token refreshed successfully');
  } catch (err) {
    return error(res, 'Invalid refresh token', 401, 'UNAUTHORIZED');
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  const { refreshToken } = req.body;
  
  if (refreshToken) {
    // Delete refresh token from DB
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  if (req.user) {
    await logActivity(req.user.id, 'LOGOUT', 'User', req.user.id, null, req.ip);
  }

  return success(res, null, 'Logged out successfully');
};

/**
 * GET /api/auth/me
 */
const me = async (req, res) => {
  // User is already attached by authenticate middleware
  return success(res, { user: req.user });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
};
