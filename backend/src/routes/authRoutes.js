const express = require('express');
const { login, logout, getMe } = require('../controllers/authController');
const { loginValidator } = require('../validators/authValidators');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.post('/login', loginValidator, validate, login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);

module.exports = router;
