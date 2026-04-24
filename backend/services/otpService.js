const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};

/**
 * Create and store an OTP for a user
 * @param {string} userId 
 * @param {string} type - LOGIN, RESET, or VERIFY
 * @returns {string} The plaintext OTP (to send via email)
 */
const createOTP = async (userId, type) => {
  const otp = generateOTP();
  const hashedOTP = await bcrypt.hash(otp, 10);
  const expiryTime = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate old OTPs of same type
  await db.query(
    'UPDATE otp_codes SET used = TRUE WHERE user_id = $1 AND type = $2 AND used = FALSE',
    [userId, type]
  );

  // Store new OTP
  await db.query(
    'INSERT INTO otp_codes (user_id, otp_code, type, expiry_time) VALUES ($1, $2, $3, $4)',
    [userId, hashedOTP, type, expiryTime]
  );

  return otp;
};

/**
 * Verify an OTP
 * @param {string} userId 
 * @param {string} otp - Plaintext OTP to verify
 * @param {string} type - LOGIN, RESET, or VERIFY
 * @returns {boolean} Whether the OTP is valid
 */
const verifyOTP = async (userId, otp, type) => {
  const result = await db.query(
    `SELECT * FROM otp_codes 
     WHERE user_id = $1 AND type = $2 AND used = FALSE AND expiry_time > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [userId, type]
  );

  if (result.rows.length === 0) {
    return false;
  }

  const otpRecord = result.rows[0];
  const isValid = await bcrypt.compare(otp, otpRecord.otp_code);

  if (isValid) {
    // Mark as used
    await db.query('UPDATE otp_codes SET used = TRUE WHERE id = $1', [otpRecord.id]);
  }

  return isValid;
};

module.exports = { generateOTP, createOTP, verifyOTP };
