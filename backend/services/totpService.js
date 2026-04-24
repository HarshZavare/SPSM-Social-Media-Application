const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

/**
 * Generate a TOTP secret for a user
 * @param {string} email - User's email for the label
 * @returns {{ secret: string, otpauthUrl: string }}
 */
const generateSecret = (email) => {
  const secret = speakeasy.generateSecret({
    name: `SPSM:${email}`,
    issuer: 'SPSM - Secure Social Media',
    length: 32,
  });

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
  };
};

/**
 * Generate QR code as data URL
 * @param {string} otpauthUrl 
 * @returns {Promise<string>} Base64 data URL of QR code
 */
const generateQRCode = async (otpauthUrl) => {
  try {
    const dataUrl = await QRCode.toDataURL(otpauthUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#f8fafc',
      },
    });
    return dataUrl;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Verify a TOTP token
 * @param {string} token - 6-digit TOTP code
 * @param {string} secret - Base32 encoded secret
 * @returns {boolean} Whether the token is valid
 */
const verifyToken = (token, secret) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1, // Allow 1 step tolerance (30 seconds)
  });
};

module.exports = { generateSecret, generateQRCode, verifyToken };
