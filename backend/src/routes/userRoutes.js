const express = require('express');
const { getAllUsers, updateUserRole, getEmployees } = require('../controllers/userController');
const requireAuth = require('../middleware/auth');
const { requireAdmin, requireManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// GET /api/users/employees — Admin & Task Manager
router.get('/employees', requireManagerOrAdmin, getEmployees);

// Admin-only endpoints
router.get('/', requireAdmin, getAllUsers);
router.patch('/:id/role', requireAdmin, updateUserRole);

module.exports = router;
