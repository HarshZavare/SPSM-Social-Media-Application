const nodemailer = require('nodemailer');
const { createTransporter } = require('../config/email');

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 */
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: `"SPSM Security" <${process.env.EMAIL_FROM || 'security@spsm.app'}>`,
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent: ${info.messageId}`);
    
    // Log Ethereal preview URL in development
    if (process.env.NODE_ENV === 'development') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`   Preview: ${previewUrl}`);
      }
    }

    return info;
  } catch (error) {
    console.error('Email send error:', error.message);
    throw error;
  }
};

/**
 * Send OTP email
 */
const sendOTPEmail = async (to, otp, purpose = 'login') => {
  const purposeText = {
    login: 'Login Verification',
    verify: 'Email Verification',
    reset: 'Password Reset',
  };

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #0a0e1a 0%, #1a1f3a 100%); border-radius: 16px; overflow: hidden;">
      <div style="padding: 40px 32px; text-align: center;">
        <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #3b82f6, #22d3ee); border-radius: 16px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 28px;">🔒</span>
        </div>
        <h1 style="color: #f1f5f9; font-size: 24px; margin: 0 0 8px;">${purposeText[purpose] || 'Verification Code'}</h1>
        <p style="color: #94a3b8; font-size: 14px; margin: 0 0 32px;">Your one-time verification code is:</p>
        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 24px; margin: 0 0 24px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #3b82f6; font-family: 'Courier New', monospace;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; margin: 0;">
          This code expires in <strong style="color: #f59e0b;">5 minutes</strong>.<br>
          If you didn't request this, please ignore this email.
        </p>
      </div>
      <div style="background: rgba(0,0,0,0.3); padding: 16px; text-align: center;">
        <p style="color: #475569; font-size: 11px; margin: 0;">SPSM - Secure Privacy-focused Social Media</p>
      </div>
    </div>
  `;

  return sendEmail(to, `SPSM - ${purposeText[purpose] || 'Verification'} Code: ${otp}`, html);
};

/**
 * Send security alert email
 */
const sendSecurityAlert = async (to, alertType, details = {}) => {
  const alerts = {
    account_locked: {
      title: '⚠️ Account Locked',
      message: 'Your account has been temporarily locked due to multiple failed login attempts.',
      color: '#ef4444',
    },
    new_login: {
      title: '🔐 New Login Detected',
      message: `A new login was detected from IP: ${details.ip || 'unknown'}`,
      color: '#f59e0b',
    },
    password_changed: {
      title: '🔑 Password Changed',
      message: 'Your password was successfully changed. If you did not make this change, please reset your password immediately.',
      color: '#3b82f6',
    },
    suspicious_activity: {
      title: '🚨 Suspicious Activity Detected',
      message: details.message || 'Unusual activity was detected on your account.',
      color: '#ef4444',
    },
  };

  const alert = alerts[alertType] || { title: 'Security Notice', message: 'A security event occurred.', color: '#3b82f6' };

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #0a0e1a 0%, #1a1f3a 100%); border-radius: 16px; overflow: hidden;">
      <div style="padding: 40px 32px; text-align: center;">
        <h1 style="color: #f1f5f9; font-size: 24px; margin: 0 0 16px;">${alert.title}</h1>
        <div style="background: rgba(255,255,255,0.05); border-left: 4px solid ${alert.color}; border-radius: 8px; padding: 16px; text-align: left; margin: 0 0 24px;">
          <p style="color: #cbd5e1; font-size: 14px; margin: 0;">${alert.message}</p>
        </div>
        <p style="color: #64748b; font-size: 12px; margin: 0;">
          Time: ${new Date().toISOString()}<br>
          If this wasn't you, please secure your account immediately.
        </p>
      </div>
      <div style="background: rgba(0,0,0,0.3); padding: 16px; text-align: center;">
        <p style="color: #475569; font-size: 11px; margin: 0;">SPSM - Secure Privacy-focused Social Media</p>
      </div>
    </div>
  `;

  return sendEmail(to, `SPSM Security Alert: ${alert.title}`, html);
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #0a0e1a 0%, #1a1f3a 100%); border-radius: 16px; overflow: hidden;">
      <div style="padding: 40px 32px; text-align: center;">
        <h1 style="color: #f1f5f9; font-size: 24px; margin: 0 0 16px;">🔑 Password Reset</h1>
        <p style="color: #94a3b8; font-size: 14px; margin: 0 0 32px;">Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">Reset Password</a>
        <p style="color: #64748b; font-size: 12px; margin: 24px 0 0;">
          This link expires in <strong style="color: #f59e0b;">10 minutes</strong>.<br>
          If you didn't request this, ignore this email.
        </p>
      </div>
    </div>
  `;

  return sendEmail(to, 'SPSM - Password Reset Request', html);
};

module.exports = { sendEmail, sendOTPEmail, sendSecurityAlert, sendPasswordResetEmail };
