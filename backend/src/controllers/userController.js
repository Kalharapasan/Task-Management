const UserModel = require('../models/userModel');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/users/employees — admin only, returns list of employees for task assignment
const getEmployees = asyncHandler(async (req, res) => {
  const employees = await UserModel.findEmployees();
  res.status(200).json({ success: true, data: { employees } });
});

module.exports = { getEmployees };
