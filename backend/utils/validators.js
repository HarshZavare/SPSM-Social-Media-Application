const { body, param, query, validationResult } = require('express-validator');

/**
 * Process validation results and return errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Registration validation
const registerRules = [
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email too long'),
  body('username')
    .isAlphanumeric().withMessage('Username must be alphanumeric')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('password')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain a special character'),
  validate,
];

// Login validation
const loginRules = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// OTP validation
const otpRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('otp')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must be numeric'),
  validate,
];

// Privacy settings validation
const privacyRules = [
  body('profile_visibility')
    .optional()
    .isIn(['PUBLIC', 'FRIENDS_ONLY', 'PRIVATE']).withMessage('Invalid visibility level'),
  body('post_visibility')
    .optional()
    .isIn(['PUBLIC', 'FRIENDS_ONLY', 'PRIVATE']).withMessage('Invalid visibility level'),
  body('contact_visibility')
    .optional()
    .isIn(['PUBLIC', 'FRIENDS_ONLY', 'PRIVATE']).withMessage('Invalid visibility level'),
  validate,
];

// Message validation
const messageRules = [
  body('receiverId').isUUID().withMessage('Invalid receiver ID'),
  body('content').notEmpty().withMessage('Message content required')
    .isLength({ max: 5000 }).withMessage('Message too long (max 5000 chars)'),
  validate,
];

// Password reset request
const resetRequestRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  validate,
];

// Password reset
const resetRules = [
  body('token').notEmpty().withMessage('Reset token required'),
  body('newPassword')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain a special character'),
  validate,
];

// 2FA validation
const twoFARules = [
  body('token')
    .isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits')
    .isNumeric().withMessage('Token must be numeric'),
  validate,
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  otpRules,
  privacyRules,
  messageRules,
  resetRequestRules,
  resetRules,
  twoFARules,
};
