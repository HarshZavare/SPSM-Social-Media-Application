const db = require('../config/db');

/**
 * Log a security event
 * @param {string|null} userId 
 * @param {string} eventType - One of the event_type ENUM values
 * @param {string|null} ipAddress 
 * @param {string|null} userAgent 
 * @param {object|null} metadata - Additional JSON metadata
 */
const logSecurityEvent = async (userId, eventType, ipAddress = null, userAgent = null, metadata = null) => {
  try {
    await db.query(
      `INSERT INTO security_logs (user_id, event_type, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, eventType, ipAddress, userAgent, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (error) {
    // Don't let logging failures crash the app
    console.error('Security logging error:', error.message);
  }
};

/**
 * Get security logs for a user
 * @param {string} userId 
 * @param {object} options - Filtering options
 */
const getSecurityLogs = async (userId, options = {}) => {
  const { eventType, limit = 50, offset = 0, startDate, endDate } = options;
  
  let queryText = 'SELECT * FROM security_logs WHERE user_id = $1';
  const params = [userId];
  let paramIndex = 2;

  if (eventType) {
    queryText += ` AND event_type = $${paramIndex}`;
    params.push(eventType);
    paramIndex++;
  }

  if (startDate) {
    queryText += ` AND timestamp >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    queryText += ` AND timestamp <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  queryText += ` ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await db.query(queryText, params);
  return result.rows;
};

/**
 * Get log statistics for a user
 */
const getLogStats = async (userId) => {
  const result = await db.query(
    `SELECT event_type, COUNT(*) as count 
     FROM security_logs 
     WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '30 days'
     GROUP BY event_type 
     ORDER BY count DESC`,
    [userId]
  );
  return result.rows;
};

module.exports = { logSecurityEvent, getSecurityLogs, getLogStats };
