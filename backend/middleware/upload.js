const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

// Allowed MIME types
const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// File filter
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_TYPES[file.mimetype]) {
    return cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }

  // Check extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ALLOWED_TYPES[file.mimetype];
  if (!allowedExts.includes(ext)) {
    return cb(new Error(`File extension ${ext} does not match MIME type`), false);
  }

  // Prevent directory traversal in filename
  const sanitizedName = path.basename(file.originalname);
  if (sanitizedName !== file.originalname || file.originalname.includes('..')) {
    return cb(new Error('Invalid filename detected'), false);
  }

  cb(null, true);
};

// Use memory storage so we can encrypt before writing to disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// Error handler middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

module.exports = { upload, handleUploadError, ALLOWED_TYPES, MAX_FILE_SIZE };
