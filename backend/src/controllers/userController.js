const UserModel = require('../models/userModel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/users — Admin only, returns all registered users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await UserModel.findAllUsers();
  res.status(200).json({ success: true, data: { users } });
});

// PATCH /api/users/:id/role — Admin only, update a user's role
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  if (!role) {
    throw new ApiError(400, 'Role is required');
  }

  if (!UserModel.ALLOWED_ROLES.includes(role)) {
    throw new ApiError(400, `Invalid role. Must be one of: ${UserModel.ALLOWED_ROLES.join(', ')}`);
  }

  // Prevent admin from accidentally demoting themselves if they are the only admin
  if (Number(id) === req.user.id && role !== 'admin') {
    throw new ApiError(400, 'You cannot demote your own Admin account');
  }

  const updatedUser = await UserModel.updateRole(id, role);
  if (!updatedUser) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    success: true,
    message: `User role updated to ${role}`,
    data: { user: updatedUser },
  });
});

// GET /api/users/employees — Admin & Task Manager, returns assignable users
const getEmployees = asyncHandler(async (req, res) => {
  const employees = await UserModel.findEmployees();
  res.status(200).json({ success: true, data: { employees } });
});

module.exports = { getAllUsers, updateUserRole, getEmployees };
