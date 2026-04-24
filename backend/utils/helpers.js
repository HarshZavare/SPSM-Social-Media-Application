/**
 * Get client IP address from request
 */
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         'unknown';
};

/**
 * Format a date for display
 */
const formatDate = (date) => {
  return new Date(date).toISOString();
};

/**
 * Sleep utility for rate limiting
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Safe JSON parse
 */
const safeJsonParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

/**
 * Paginate results
 */
const paginate = (page = 1, limit = 20) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 20));
  return { limit: l, offset: (p - 1) * l };
};

module.exports = { getClientIP, formatDate, sleep, safeJsonParse, paginate };
