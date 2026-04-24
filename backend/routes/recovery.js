const express = require('express');
const router = express.Router();
const { requestPasswordReset, resetPassword } = require('../controllers/recoveryController');
const { resetLimiter } = require('../middleware/rateLimiter');
const { resetRequestRules, resetRules } = require('../utils/validators');

// Public routes (no auth needed for password recovery)
router.post('/password-reset-request', resetLimiter, resetRequestRules, requestPasswordReset);
router.post('/password-reset', resetLimiter, resetRules, resetPassword);

module.exports = router;
