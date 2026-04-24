const express = require('express');
const router = express.Router();
const { uploadFile, downloadFile, listFiles, getUsers, shareFile, listSharedFiles } = require('../controllers/fileController');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

// All file routes require authentication
router.post('/upload', authenticateToken, uploadLimiter, upload.single('file'), handleUploadError, uploadFile);
router.get('/download/:fileId', authenticateToken, downloadFile);
router.get('/list', authenticateToken, listFiles);
router.get('/users', authenticateToken, getUsers);
router.post('/share', authenticateToken, shareFile);
router.get('/shared', authenticateToken, listSharedFiles);

module.exports = router;
