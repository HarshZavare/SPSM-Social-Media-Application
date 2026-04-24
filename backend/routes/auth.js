const express = require('express');
const router = express.Router();
const { register, login, verifyOTPHandler, enable2FA, verify2FA, logout, getKeys, ping } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const { registerRules, loginRules, otpRules, twoFARules } = require('../utils/validators');

// Public routes
router.post('/register', authLimiter, registerRules, register);
router.post('/login', authLimiter, loginRules, login);
router.post('/verify-otp', otpLimiter, otpRules, verifyOTPHandler);

// Protected routes
router.post('/enable-2fa', authenticateToken, enable2FA);
router.post('/verify-2fa', authenticateToken, twoFARules, verify2FA);
router.post('/logout', authenticateToken, logout);
router.get('/keys', authenticateToken, getKeys);
router.post('/ping', authenticateToken, ping);

module.exports = router;
