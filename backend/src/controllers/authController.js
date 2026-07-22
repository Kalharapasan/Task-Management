const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const UserModel = require('../models/userModel');
const RefreshTokenModel = require('../models/refreshTokenModel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/auth';
const REFRESH_TOKEN_DAYS = 7;

function refreshCookieOptions() {
  const sameSite = process.env.COOKIE_SAME_SITE || 'lax';
  return {
    httpOnly: true,
    secure: sameSite === 'none' ? true : process.env.NODE_ENV === 'production',
    sameSite,
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  };
}

function clearCookieOptions() {
  const { httpOnly, secure, sameSite, path } = refreshCookieOptions();
  return { httpOnly, secure, sameSite, path };
}

async function issueTokenPair(res, user) {
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

  await RefreshTokenModel.create(user.id, jti, expiresAt);

  // Include role in the access token so middleware can check it without a DB round-trip.
  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id, jti });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

  return accessToken;
}

// POST /api/auth/register  (public — creates an employee account)
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await UserModel.findByEmail(email);
  if (existing) {
    throw new ApiError(409, 'An account with that email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await UserModel.create(name, email, hashedPassword);

  res.status(201).json({
    success: true,
    message: 'Account created successfully. You can now log in.',
    data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await UserModel.findByEmail(email);
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const accessToken = await issueTokenPair(res, user);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
  });
});

// POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    throw new ApiError(401, 'No refresh token provided');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (error) {
    res.clearCookie(REFRESH_COOKIE_NAME, clearCookieOptions());
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const validSession = await RefreshTokenModel.findValid(decoded.id, decoded.jti);
  if (!validSession) {
    res.clearCookie(REFRESH_COOKIE_NAME, clearCookieOptions());
    throw new ApiError(401, 'Refresh session no longer valid, please log in again');
  }

  await RefreshTokenModel.revoke(decoded.jti);

  const user = await UserModel.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'User no longer exists');
  }

  const accessToken = await issueTokenPair(res, user);

  res.status(200).json({
    success: true,
    message: 'Token refreshed',
    data: {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
  });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];

  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      await RefreshTokenModel.revoke(decoded.jti);
    } catch (error) {
      // Token already invalid/expired — nothing to revoke.
    }
  }

  res.clearCookie(REFRESH_COOKIE_NAME, clearCookieOptions());
  res.status(200).json({ success: true, message: 'Logout successful' });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({ success: true, data: { user } });
});

module.exports = { register, login, refresh, logout, getMe };
