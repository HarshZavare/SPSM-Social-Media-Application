const { getSecurityLogs, getLogStats } = require('../services/loggingService');
const { getSecurityAlerts } = require('../services/incidentService');

/**
 * GET /api/monitoring/logs
 */
const getLogs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { eventType, limit = 50, offset = 0, startDate, endDate } = req.query;

    const logs = await getSecurityLogs(userId, {
      eventType,
      limit: parseInt(limit),
      offset: parseInt(offset),
      startDate,
      endDate,
    });

    const stats = await getLogStats(userId);

    res.json({
      success: true,
      logs,
      stats,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: logs.length,
      },
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve logs.' });
  }
};

/**
 * GET /api/monitoring/security-alerts
 */
const getAlerts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const alerts = await getSecurityAlerts(userId);

    res.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve alerts.' });
  }
};
/**
 * GET /api/monitoring/export-csv
 */
const exportLogsCSV = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { eventType, endDate } = req.query;

    const logs = await getSecurityLogs(userId, {
      eventType,
      limit: 10000,
      offset: 0,
      endDate,
    });

    // Build CSV
    const headers = ['Event Type', 'IP Address', 'User Agent', 'Details', 'Timestamp'];
    const rows = logs.map(log => [
      log.event_type,
      log.ip_address || '',
      (log.user_agent || '').replace(/"/g, '""'),
      log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : '',
      new Date(log.timestamp).toISOString(),
    ]);

    let csv = headers.join(',') + '\n';
    for (const row of rows) {
      csv += row.map(field => `"${field}"`).join(',') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=security_logs_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ success: false, message: 'Failed to export logs.' });
  }
};

module.exports = { getLogs, getAlerts, exportLogsCSV };
