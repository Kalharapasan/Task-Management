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

const router = express.Router();

// Every task route requires a valid JWT.
router.use(requireAuth);

router.get('/stats/dashboard', getDashboardStats);

// Bulk routes must be declared before "/:id" so "bulk" isn't swallowed
// by the numeric id param matcher.
router.patch('/bulk/status', bulkUpdateStatusValidator, validate, bulkUpdateStatus);
router.delete('/bulk', bulkIdsValidator, validate, bulkDeleteTasks);

router.get('/', getTasks);
router.get('/:id', idParamValidator, validate, getTaskById);
router.post('/', createTaskValidator, validate, createTask);
router.put('/:id', updateTaskValidator, validate, updateTask);
router.delete('/:id', idParamValidator, validate, deleteTask);

module.exports = router;
