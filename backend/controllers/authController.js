const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { createOTP, verifyOTP } = require('../services/otpService');
const { generateSecret, generateQRCode, verifyToken } = require('../services/totpService');
const { sendOTPEmail, sendSecurityAlert } = require('../services/emailService');
const { logSecurityEvent } = require('../services/loggingService');
const { checkLoginPatterns, handleSuspiciousActivity } = require('../services/incidentService');
const { getClientIP } = require('../utils/helpers');
const crypto = require('crypto');
require('dotenv').config();

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const ip = getClientIP(req);

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email or username already exists.',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await db.query(
      `INSERT INTO users (email, username, password_hash, display_name)
       VALUES ($1, $2, $3, $4) RETURNING id, email, username, created_at`,
      [email, username, passwordHash, username]
    );

    const user = result.rows[0];

    // Create default privacy settings
    await db.query(
      `INSERT INTO privacy_settings (user_id, profile_visibility, post_visibility, contact_visibility, last_seen_visibility)
       VALUES ($1, 'PUBLIC', 'FRIENDS_ONLY', 'PRIVATE', 'FRIENDS_ONLY')`,
      [user.id]
    );

    // Log registration
    await logSecurityEvent(user.id, 'REGISTER', ip, req.headers['user-agent']);

    res.status(201).json({
      success: true,
      message: 'Registration successful. You can now log in.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed.' });
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = getClientIP(req);

    // Find user
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = result.rows[0];

    // Check account lockout
    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.account_locked_until) - new Date()) / 60000);
      await logSecurityEvent(user.id, 'LOGIN_FAILED', ip, req.headers['user-agent'], {
        reason: 'Account locked',
      });
      return res.status(423).json({
        success: false,
        message: `Account is locked. Try again in ${remainingTime} minutes.`,
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      // Increment failed attempts
      const newAttempts = user.failed_login_attempts + 1;
      const updateFields = { failed_login_attempts: newAttempts };

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCKOUT_DURATION);
        await db.query(
          'UPDATE users SET failed_login_attempts = $1, account_locked_until = $2 WHERE id = $3',
          [newAttempts, lockUntil, user.id]
        );
        await logSecurityEvent(user.id, 'ACCOUNT_LOCKED', ip, req.headers['user-agent'], {
          reason: 'Max failed login attempts reached',
        });
        try {
          await sendSecurityAlert(user.email, 'account_locked');
        } catch (err) {
          console.error('Failed to send lockout email:', err.message);
        }
      } else {
        await db.query(
          'UPDATE users SET failed_login_attempts = $1 WHERE id = $2',
          [newAttempts, user.id]
        );
      }

      await logSecurityEvent(user.id, 'LOGIN_FAILED', ip, req.headers['user-agent'], {
        attempts: newAttempts,
      });

      // Check for suspicious patterns
      const alerts = await checkLoginPatterns(user.id, ip);
      await handleSuspiciousActivity(user.id, alerts, ip);

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        attemptsRemaining: MAX_FAILED_ATTEMPTS - newAttempts,
      });
    }

    // Reset failed attempts
    await db.query(
      'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE id = $1',
      [user.id]
    );

    // Always send OTP for multifactor authentication upon login
    const otp = await createOTP(user.id, 'LOGIN');
    try {
      await sendOTPEmail(user.email, otp, 'login');
    } catch (err) {
      console.error('Failed to send login OTP:', err.message);
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete login.',
      requiresOTP: true,
      requires2FA: !!user.twofa_secret,
      email: user.email,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
};

/**
 * POST /api/auth/verify-otp
 */
const verifyOTPHandler = async (req, res) => {
  try {
    const { email, otp, type = 'LOGIN' } = req.body;
    const ip = getClientIP(req);

    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = userResult.rows[0];
    const isValid = await verifyOTP(user.id, otp, type);

    if (!isValid) {
      await logSecurityEvent(user.id, 'LOGIN_FAILED', ip, req.headers['user-agent'], {
        reason: 'Invalid OTP',
      });
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    // If verifying email
    if (type === 'VERIFY') {
      await db.query('UPDATE users SET email_verified = TRUE WHERE id = $1', [user.id]);
      await logSecurityEvent(user.id, 'OTP_VERIFIED', ip, req.headers['user-agent'], { type: 'email_verification' });
      return res.json({ success: true, message: 'Email verified successfully.' });
    }

    // Generate JWT for login OTP
    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    await db.query(
      'UPDATE users SET last_login_at = NOW(), last_active_at = NOW(), is_online = true, last_login_ip = $1 WHERE id = $2',
      [ip, user.id]
    );

    await logSecurityEvent(user.id, 'LOGIN_SUCCESS', ip, req.headers['user-agent'], { method: '2FA' });
    await logSecurityEvent(user.id, 'OTP_VERIFIED', ip, req.headers['user-agent']);

    res.json({
      success: true,
      message: 'OTP verified. Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        twofa_enabled: user.twofa_enabled,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: 'OTP verification failed.' });
  }
};

/**
 * POST /api/auth/enable-2fa
 */
const enable2FA = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userResult = await db.query('SELECT email, twofa_enabled FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = userResult.rows[0];

    // Generate TOTP secret
    const { secret, otpauthUrl } = generateSecret(user.email);
    const qrCode = await generateQRCode(otpauthUrl);

    // Store secret temporarily (not enabled until verified)
    await db.query(
      'UPDATE users SET twofa_secret = $1 WHERE id = $2',
      [secret, userId]
    );

    res.json({
      success: true,
      message: 'Scan the QR code with your authenticator app, then verify with a code.',
      qrCode,
      secret, // For manual entry
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ success: false, message: 'Failed to enable 2FA.' });
  }
};

/**
 * POST /api/auth/verify-2fa
 */
const verify2FA = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { token } = req.body;
    const ip = getClientIP(req);

    const userResult = await db.query('SELECT twofa_secret FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0 || !userResult.rows[0].twofa_secret) {
      return res.status(400).json({ success: false, message: 'No 2FA secret found. Please enable 2FA first.' });
    }

    const isValid = verifyToken(token, userResult.rows[0].twofa_secret);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid 2FA code.' });
    }

    await db.query('UPDATE users SET twofa_enabled = TRUE WHERE id = $1', [userId]);
    await logSecurityEvent(userId, 'TWO_FA_ENABLED', ip, req.headers['user-agent']);

    res.json({ success: true, message: 'Two-factor authentication enabled successfully.' });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify 2FA.' });
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    const ip = getClientIP(req);
    const userId = req.user.userId;
    
    // Set user offline
    await db.query('UPDATE users SET is_online = false, last_active_at = NOW() WHERE id = $1', [userId]);
    
    await logSecurityEvent(userId, 'LOGOUT', ip, req.headers['user-agent']);

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed.' });
  }
};

/**
 * GET /api/auth/keys
 */
const getKeys = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await db.query(
      'SELECT public_key, encrypted_private_key FROM user_encryption_keys WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Generate keys on the fly
      const keys = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
      const iv = crypto.randomBytes(16).toString('hex');
      
      await db.query(
        'INSERT INTO user_encryption_keys (user_id, public_key, encrypted_private_key, iv) VALUES ($1, $2, $3, $4)',
        [userId, keys.publicKey, keys.privateKey, iv]
      );
      
      return res.json({
        success: true,
        publicKey: keys.publicKey,
        privateKey: keys.privateKey,
      });
    }

    res.json({
      success: true,
      publicKey: result.rows[0].public_key,
      privateKey: result.rows[0].encrypted_private_key, // simplified
    });
  } catch (error) {
    console.error('Get keys error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch keys.' });
  }
};

/**
 * POST /api/auth/ping
 * Updates the user's last_active_at timestamp.
 */
const ping = async (req, res) => {
  try {
    const userId = req.user.userId;
    await db.query('UPDATE users SET last_active_at = NOW(), is_online = true WHERE id = $1', [userId]);
    res.json({ success: true });
  } catch (error) {
    // Fail silently so we don't spam the network tab with errors
    res.status(500).json({ success: false });
  }
};

module.exports = { register, login, verifyOTPHandler, enable2FA, verify2FA, logout, getKeys, ping };
