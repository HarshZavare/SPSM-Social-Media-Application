const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, getConversations } = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');
const { messageRules } = require('../utils/validators');

// All message routes require authentication
router.post('/send', authenticateToken, messageRules, sendMessage);
router.get('/conversations', authenticateToken, getConversations);
router.get('/get/:userId', authenticateToken, getMessages);

module.exports = router;
