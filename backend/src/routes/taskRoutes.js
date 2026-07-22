const express = require('express');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getDashboardStats,
  bulkUpdateStatus,
  bulkDeleteTasks,
} = require('../controllers/taskController');
const {
  createTaskValidator,
  updateTaskValidator,
  idParamValidator,
  bulkUpdateStatusValidator,
  bulkIdsValidator,
} = require('../validators/taskValidators');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/auth');
const { requireManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// All task routes require a valid JWT.
router.use(requireAuth);

router.get('/stats/dashboard', getDashboardStats);

// Bulk routes before /:id so "bulk" isn't swallowed by numeric id param.
router.patch('/bulk/status', requireManagerOrAdmin, bulkUpdateStatusValidator, validate, bulkUpdateStatus);
router.delete('/bulk', requireManagerOrAdmin, bulkIdsValidator, validate, bulkDeleteTasks);

router.get('/', getTasks);
router.get('/:id', idParamValidator, validate, getTaskById);

// Create & Delete require Admin or Task Manager role; update is available to all (controller handles employee field restrictions).
router.post('/', requireManagerOrAdmin, createTaskValidator, validate, createTask);
router.put('/:id', idParamValidator, validate, updateTask);
router.delete('/:id', requireManagerOrAdmin, idParamValidator, validate, deleteTask);

module.exports = router;
