const express = require('express');
const router = express.Router();
const { getPrivacySettings, updatePrivacySettings, viewProfile } = require('../controllers/privacyController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { privacyRules } = require('../utils/validators');

// Protected routes
router.get('/settings', authenticateToken, getPrivacySettings);
router.put('/settings', authenticateToken, privacyRules, updatePrivacySettings);

// Profile viewing (optional auth for public profiles)
router.get('/profile/view/:userId', optionalAuth, viewProfile);

module.exports = router;
