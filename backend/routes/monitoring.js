const express = require('express');
const router = express.Router();
const { getLogs, getAlerts, exportLogsCSV } = require('../controllers/monitoringController');
const { authenticateToken } = require('../middleware/auth');

// All monitoring routes require authentication
router.get('/logs', authenticateToken, getLogs);
router.get('/export-csv', authenticateToken, exportLogsCSV);
router.get('/security-alerts', authenticateToken, getAlerts);

module.exports = router;
