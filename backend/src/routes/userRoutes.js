const express = require('express');
const { getEmployees } = require('../controllers/userController');
const requireAuth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// GET /api/users/employees — admin only
router.get('/employees', requireAdmin, getEmployees);

module.exports = router;
