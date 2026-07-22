const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/jwt');


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

  const token = signToken({ id: user.id, email: user.email });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
  });
});

/**
 * POST /api/auth/logout
 * JWTs are stateless, so "logout" is really just an acknowledgement
 * telling the frontend to discard its stored token. Kept as a real
 * endpoint (rather than handled purely client-side) so it matches the
 * REST API surface requested in the assessment and leaves room for a
 * future token-blacklist/refresh-token strategy.
 */
const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user, useful for the frontend
 * to rehydrate auth state on page refresh.
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    success: true,
    data: { user },
  });
});

module.exports = { login, logout, getMe };
