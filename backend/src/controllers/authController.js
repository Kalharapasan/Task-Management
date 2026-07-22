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

  const accessToken = signAccessToken({ id: user.id, email: user.email });
  const refreshToken = signRefreshToken({ id: user.id, jti });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

  return accessToken;
}

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
      user: { id: user.id, name: user.name, email: user.email },
    },
  });
});


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

  // Rotate: invalidate the token just used and issue a brand new one.
  await RefreshTokenModel.revoke(decoded.jti);

  const user = await UserModel.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'User no longer exists');
  }

  const accessToken = await issueTokenPair(res, user);

  res.status(200).json({
    success: true,
    message: 'Token refreshed',
    data: { accessToken, user },
  });
});


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


const getMe = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({ success: true, data: { user } });
});

module.exports = { login, refresh, logout, getMe };
