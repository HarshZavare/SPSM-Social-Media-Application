const bcrypt = require('bcrypt');
const db = require('../config/db');
const { generateSecureToken, hashToken } = require('../services/encryptionService');
const { sendPasswordResetEmail } = require('../services/emailService');
const { logSecurityEvent } = require('../services/loggingService');
const { getClientIP } = require('../utils/helpers');

const SALT_ROUNDS = 12;
const RESET_EXPIRY_MINUTES = 10;

/**
 * POST /api/recovery/password-reset-request
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const ip = getClientIP(req);

    // Always return success to prevent user enumeration
    const successResponse = {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    };

    // Find user
    const userResult = await db.query('SELECT id, email FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.json(successResponse);
    }

    const user = userResult.rows[0];

    // Check rate limiting (max 3 requests in 15 minutes)
    const recentResets = await db.query(
      `SELECT COUNT(*) as count FROM password_resets 
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '15 minutes'`,
      [user.id]
    );

    if (parseInt(recentResets.rows[0].count) >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many reset requests. Please try again later.',
      });
    }

    // Generate reset token
    const plainToken = generateSecureToken(32);
    const hashedToken = hashToken(plainToken);
    const expiryTime = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate old tokens
    await db.query(
      'UPDATE password_resets SET used = TRUE WHERE user_id = $1 AND used = FALSE',
      [user.id]
    );

    // Store new token
    await db.query(
      'INSERT INTO password_resets (user_id, reset_token, expiry_time) VALUES ($1, $2, $3)',
      [user.id, hashedToken, expiryTime]
    );

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, plainToken);
    } catch (err) {
      console.error('Failed to send reset email:', err.message);
    }

    await logSecurityEvent(user.id, 'PASSWORD_RESET_REQUEST', ip, req.headers['user-agent']);

    res.json(successResponse);
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ success: false, message: 'Password reset request failed.' });
  }
};

/**
 * POST /api/recovery/password-reset
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const ip = getClientIP(req);

    // Hash the provided token to compare
    const hashedToken = hashToken(token);

    // Find valid reset token
    const resetResult = await db.query(
      `SELECT pr.*, u.email FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.reset_token = $1 AND pr.used = FALSE AND pr.expiry_time > NOW()
       ORDER BY pr.created_at DESC LIMIT 1`,
      [hashedToken]
    );

    if (resetResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
    }

    const resetRecord = resetResult.rows[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, failed_login_attempts = 0, account_locked_until = NULL WHERE id = $2',
      [passwordHash, resetRecord.user_id]
    );

    // Mark token as used
    await db.query('UPDATE password_resets SET used = TRUE WHERE id = $1', [resetRecord.id]);

    // Invalidate all other tokens
    await db.query(
      'UPDATE password_resets SET used = TRUE WHERE user_id = $1',
      [resetRecord.user_id]
    );

    await logSecurityEvent(resetRecord.user_id, 'PASSWORD_RESET', ip, req.headers['user-agent']);

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ success: false, message: 'Password reset failed.' });
  }
};

module.exports = { requestPasswordReset, resetPassword };
