const express = require('express');
const router = express.Router();
const { listUsers, sendRequest, acceptRequest, rejectRequest } = require('../controllers/friendsController');
const { authenticateToken } = require('../middleware/auth');

// All friend routes require authentication
router.use(authenticateToken);

router.get('/users', listUsers);
router.post('/request', sendRequest);
router.put('/accept', acceptRequest);
router.post('/reject', rejectRequest);

module.exports = router;
