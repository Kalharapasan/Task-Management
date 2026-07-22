const { body, param } = require('express-validator');
const TaskModel = require('../models/taskModel');

const isTodayOrLater = (value) => {
  const due = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due >= today;
};

const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must be 255 characters or fewer'),
  body('description').optional({ checkFalsy: true }).trim(),
  body('priority')
    .notEmpty()
    .withMessage('Priority is required')
    .isIn(TaskModel.ALLOWED_PRIORITY)
    .withMessage(`Priority must be one of: ${TaskModel.ALLOWED_PRIORITY.join(', ')}`),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(TaskModel.ALLOWED_STATUS)
    .withMessage(`Status must be one of: ${TaskModel.ALLOWED_STATUS.join(', ')}`),
  body('due_date')
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Due date must be a valid date (YYYY-MM-DD)')
    .custom(isTodayOrLater)
    .withMessage('Due date cannot be earlier than today'),
];

const updateTaskValidator = [
  param('id').isInt().withMessage('Invalid task id'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must be 255 characters or fewer'),
  body('description').optional({ checkFalsy: true }).trim(),
  body('priority')
    .notEmpty()
    .withMessage('Priority is required')
    .isIn(TaskModel.ALLOWED_PRIORITY)
    .withMessage(`Priority must be one of: ${TaskModel.ALLOWED_PRIORITY.join(', ')}`),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(TaskModel.ALLOWED_STATUS)
    .withMessage(`Status must be one of: ${TaskModel.ALLOWED_STATUS.join(', ')}`),
  body('due_date')
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Due date must be a valid date (YYYY-MM-DD)'),
];

const idParamValidator = [param('id').isInt().withMessage('Invalid task id')];

const bulkIdsValidator = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('ids must be a non-empty array of task ids'),
  body('ids.*').isInt().withMessage('Each id must be an integer'),
];

const bulkUpdateStatusValidator = [
  ...bulkIdsValidator,
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(TaskModel.ALLOWED_STATUS)
    .withMessage(`Status must be one of: ${TaskModel.ALLOWED_STATUS.join(', ')}`),
];

module.exports = {
  createTaskValidator,
  updateTaskValidator,
  idParamValidator,
  bulkIdsValidator,
  bulkUpdateStatusValidator,
};
