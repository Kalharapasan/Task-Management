const express = require('express');
const { login, refresh, logout, getMe } = require('../controllers/authController');
const { loginValidator } = require('../validators/authValidators');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/login', loginLimiter, loginValidator, validate, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

module.exports = router;
