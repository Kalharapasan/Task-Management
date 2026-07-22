const express = require('express');
const { login, refresh, logout, getMe } = require('../controllers/authController');
const { loginValidator } = require('../validators/authValidators');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.post('/login', loginValidator, validate, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

module.exports = router;
