const TaskModel = require('../models/taskModel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/tasks
const getTasks = asyncHandler(async (req, res) => {
  const { search, status, priority, sort, page, limit } = req.query;
  const isAdmin = req.user.role === 'admin';

  const { tasks, pagination } = await TaskModel.findAll(req.user.id, isAdmin, {
    search, status, priority, sort, page, limit,
  });

  res.status(200).json({ success: true, count: tasks.length, data: { tasks, pagination } });
});

// GET /api/tasks/:id
const getTaskById = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const task = await TaskModel.findById(req.params.id, req.user.id, isAdmin);
  if (!task) throw new ApiError(404, 'Task not found');

  res.status(200).json({ success: true, data: { task } });
});

// POST /api/tasks  (admin only — enforced at route level)
const createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, status, due_date, assigned_to } = req.body;

  const task = await TaskModel.create(req.user.id, {
    title, description, priority, status, due_date,
    assigned_to: assigned_to || null,
  });

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: { task },
  });
});

// PUT /api/tasks/:id
// Admin: full update including re-assignment
// Employee: status-only update on their assigned tasks
const updateTask = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';

  const existing = await TaskModel.findById(req.params.id, req.user.id, isAdmin);
  if (!existing) throw new ApiError(404, 'Task not found');

  let fields;
  if (isAdmin) {
    const { title, description, priority, status, due_date, assigned_to } = req.body;
    fields = { title, description, priority, status, due_date, assigned_to };
  } else {
    // Employees may only change status
    const { status } = req.body;
    if (!status) throw new ApiError(400, 'Status is required');
    if (!TaskModel.ALLOWED_STATUS.includes(status)) {
      throw new ApiError(400, `Status must be one of: ${TaskModel.ALLOWED_STATUS.join(', ')}`);
    }
    fields = { status };
  }

  const task = await TaskModel.update(req.params.id, req.user.id, isAdmin, fields);
  if (!task) throw new ApiError(404, 'Task not found or update not permitted');

  res.status(200).json({ success: true, message: 'Task updated successfully', data: { task } });
});

// DELETE /api/tasks/:id  (admin only — enforced at route level)
const deleteTask = asyncHandler(async (req, res) => {
  const existing = await TaskModel.findById(req.params.id, req.user.id, true);
  if (!existing) throw new ApiError(404, 'Task not found');

  await TaskModel.remove(req.params.id);

  res.status(200).json({ success: true, message: 'Task deleted successfully' });
});

// GET /api/tasks/stats/dashboard
const getDashboardStats = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const stats = await TaskModel.getStats(req.user.id, isAdmin);

  res.status(200).json({ success: true, data: { stats } });
});

// PATCH /api/tasks/bulk/status  (admin only — enforced at route level)
const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { ids, status } = req.body;
  const affected = await TaskModel.bulkUpdateStatus(ids, req.user.id, status);

  res.status(200).json({
    success: true,
    message: `${affected} task(s) updated to "${status}"`,
    data: { affected },
  });
});

// DELETE /api/tasks/bulk  (admin only — enforced at route level)
const bulkDeleteTasks = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  const affected = await TaskModel.bulkRemove(ids, req.user.id);

  res.status(200).json({
    success: true,
    message: `${affected} task(s) deleted`,
    data: { affected },
  });
});

module.exports = {
  getTasks, getTaskById, createTask, updateTask,
  deleteTask, getDashboardStats, bulkUpdateStatus, bulkDeleteTasks,
};
