const db = require('../config/db');
const { sendSecurityAlert } = require('./emailService');
const { logSecurityEvent } = require('./loggingService');

/**
 * Check for suspicious login patterns
 * @param {string} userId
 * @param {string} ipAddress
 */
const checkLoginPatterns = async (userId, ipAddress) => {
  const alerts = [];

  // Check 1: Multiple failed logins in last 5 minutes
  const failedLogins = await db.query(
    `SELECT COUNT(*) as count FROM security_logs 
     WHERE user_id = $1 AND event_type = 'LOGIN_FAILED' 
     AND timestamp > NOW() - INTERVAL '5 minutes'`,
    [userId]
  );

  if (parseInt(failedLogins.rows[0].count) >= 3) {
    alerts.push({
      type: 'multiple_failed_logins',
      severity: 'high',
      message: `${failedLogins.rows[0].count} failed login attempts in the last 5 minutes`,
    });
  }

  // Check 2: Login from new IP address
  const knownIPs = await db.query(
    `SELECT DISTINCT ip_address FROM security_logs 
     WHERE user_id = $1 AND event_type = 'LOGIN_SUCCESS' 
     AND timestamp > NOW() - INTERVAL '30 days'`,
    [userId]
  );

  const knownIPList = knownIPs.rows.map(r => r.ip_address);
  if (knownIPList.length > 0 && !knownIPList.includes(ipAddress)) {
    alerts.push({
      type: 'new_ip_login',
      severity: 'medium',
      message: `Login from new IP address: ${ipAddress}`,
    });
  }

  // Check 3: Unusual activity frequency (more than 50 actions in last hour)
  const activityCount = await db.query(
    `SELECT COUNT(*) as count FROM security_logs 
     WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '1 hour'`,
    [userId]
  );

  if (parseInt(activityCount.rows[0].count) > 50) {
    alerts.push({
      type: 'high_activity',
      severity: 'medium',
      message: 'Unusual activity frequency detected',
    });
  }

  return alerts;
};

/**
 * Handle suspicious activity detection
 */
const handleSuspiciousActivity = async (userId, alerts, ipAddress) => {
  if (alerts.length === 0) return;

  // Get user email for notifications
  const userResult = await db.query('SELECT email FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) return;

  const email = userResult.rows[0].email;

  for (const alert of alerts) {
    // Log the incident
    await logSecurityEvent(userId, 'SUSPICIOUS_ACTIVITY', ipAddress, null, {
      alertType: alert.type,
      severity: alert.severity,
      message: alert.message,
    });

    // Send email alert for high severity
    if (alert.severity === 'high') {
      try {
        await sendSecurityAlert(email, 'suspicious_activity', {
          message: alert.message,
        });
      } catch (err) {
        console.error('Failed to send security alert email:', err.message);
      }
    }
  }

  // Auto-lock account for critical threats
  const highAlerts = alerts.filter(a => a.severity === 'high');
  if (highAlerts.length > 0) {
    const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await db.query(
      'UPDATE users SET account_locked_until = $1 WHERE id = $2',
      [lockUntil, userId]
    );
    await logSecurityEvent(userId, 'ACCOUNT_LOCKED', ipAddress, null, {
      reason: 'Automatic lock due to suspicious activity',
      lockUntil: lockUntil.toISOString(),
    });

    try {
      await sendSecurityAlert(email, 'account_locked');
    } catch (err) {
      console.error('Failed to send account lock email:', err.message);
    }
  }
};

/**
 * Get active security alerts for a user
 */
const getSecurityAlerts = async (userId) => {
  const result = await db.query(
    `SELECT * FROM security_logs 
     WHERE user_id = $1 AND event_type = 'SUSPICIOUS_ACTIVITY'
     ORDER BY timestamp DESC LIMIT 20`,
    [userId]
  );
  return result.rows;
};

module.exports = { checkLoginPatterns, handleSuspiciousActivity, getSecurityAlerts };
