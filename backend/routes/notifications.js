const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getNotifications, markAsRead } = require('../controllers/notificationController');

router.use(authenticateToken);

router.get('/', getNotifications);
router.post('/read', markAsRead);

module.exports = router;
