const express = require('express');
const {
  getTasks, getTaskById, createTask, updateTask,
  deleteTask, getDashboardStats, bulkUpdateStatus, bulkDeleteTasks,
} = require('../controllers/taskController');
const {
  createTaskValidator, updateTaskValidator,
  idParamValidator, bulkUpdateStatusValidator, bulkIdsValidator,
} = require('../validators/taskValidators');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All task routes require a valid JWT.
router.use(requireAuth);

router.get('/stats/dashboard', getDashboardStats);

// Bulk routes before /:id so "bulk" isn't treated as a numeric id param.
router.patch('/bulk/status', requireAdmin, bulkUpdateStatusValidator, validate, bulkUpdateStatus);
router.delete('/bulk', requireAdmin, bulkIdsValidator, validate, bulkDeleteTasks);

router.get('/', getTasks);
router.get('/:id', idParamValidator, validate, getTaskById);

// Create & delete are admin-only; update is available to both roles (controller enforces field restrictions).
router.post('/', requireAdmin, createTaskValidator, validate, createTask);
router.put('/:id', idParamValidator, validate, updateTask);
router.delete('/:id', requireAdmin, idParamValidator, validate, deleteTask);

module.exports = router;
