const TaskModel = require('../models/taskModel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/tasks
 * Supports optional query params: search, status, priority, sort.
 * Multiple filters can be combined, e.g.
 * /api/tasks?status=Pending&priority=High&search=report&sort=due_date
 */
const getTasks = asyncHandler(async (req, res) => {
  const { search, status, priority, sort, page, limit } = req.query;

  const { tasks, pagination } = await TaskModel.findAll(req.user.id, {
    search,
    status,
    priority,
    sort,
    page,
    limit,
  });

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: { tasks, pagination },
  });
});

// GET /api/tasks/:id
const getTaskById = asyncHandler(async (req, res) => {
  const task = await TaskModel.findById(req.params.id, req.user.id);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  res.status(200).json({ success: true, data: { task } });
});

// POST /api/tasks
const createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, status, due_date } = req.body;

  const task = await TaskModel.create(req.user.id, {
    title,
    description,
    priority,
    status,
    due_date,
  });

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: { task },
  });
});

// PUT /api/tasks/:id
const updateTask = asyncHandler(async (req, res) => {
  const existing = await TaskModel.findById(req.params.id, req.user.id);
  if (!existing) {
    throw new ApiError(404, 'Task not found');
  }

  const { title, description, priority, status, due_date } = req.body;
  const task = await TaskModel.update(req.params.id, req.user.id, {
    title,
    description,
    priority,
    status,
    due_date,
  });

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: { task },
  });
});

// DELETE /api/tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
  const existing = await TaskModel.findById(req.params.id, req.user.id);
  if (!existing) {
    throw new ApiError(404, 'Task not found');
  }

  await TaskModel.remove(req.params.id, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
  });
});

// GET /api/tasks/stats/dashboard
const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await TaskModel.getStats(req.user.id);

  res.status(200).json({ success: true, data: { stats } });
});

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getDashboardStats,
};
