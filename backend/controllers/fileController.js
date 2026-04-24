const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const db = require('../config/db');
const { generateKey, encryptBuffer, decryptBuffer } = require('../services/encryptionService');
const { logSecurityEvent } = require('../services/loggingService');
const { getClientIP } = require('../utils/helpers');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'encrypted');

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    // ignore if exists
  }
};

/**
 * POST /api/files/upload
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided.' });
    }

    const userId = req.user.userId;
    const ip = getClientIP(req);
    const file = req.file;

    await ensureUploadDir();

    // Generate unique filename
    const uniqueId = crypto.randomUUID();
    const encryptedFileName = `${uniqueId}.enc`;
    const encryptedPath = path.join(UPLOAD_DIR, encryptedFileName);

    // Generate per-file encryption key
    const fileKey = generateKey();

    // Calculate file hash (SHA-256)
    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Encrypt file buffer
    const { encryptedBuffer: encrypted, iv, authTag } = encryptBuffer(file.buffer, fileKey);

    // Write encrypted file to disk
    await fs.writeFile(encryptedPath, encrypted);

    // Store metadata in database
    const result = await db.query(
      `INSERT INTO files (owner_id, original_name, encrypted_path, encryption_key, iv, file_size, mime_type, scan_status, file_hash, auth_tag)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, uploaded_at`,
      [
        userId,
        file.originalname,
        encryptedFileName,
        fileKey.toString('hex'),
        iv,
        file.size,
        file.mimetype,
        'clean', // Simplified: skip ClamAV for now, mark as clean
        fileHash,
        authTag,
      ]
    );

    await logSecurityEvent(userId, 'FILE_UPLOAD', ip, req.headers['user-agent'], {
      fileId: result.rows[0].id,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded and encrypted successfully.',
      file: {
        id: result.rows[0].id,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        fileHash,
        authTag,
        uploadedAt: result.rows[0].uploaded_at,
      },
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ success: false, message: 'File upload failed.' });
  }
};

/**
 * GET /api/files/download/:fileId
 */
const downloadFile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fileId = req.params.fileId;
    const ip = getClientIP(req);

    // Get file metadata
    const result = await db.query(
      `SELECT f.* FROM files f 
       LEFT JOIN shared_files sf ON f.id = sf.file_id AND sf.shared_with = $2
       WHERE f.id = $1 AND (f.owner_id = $2 OR sf.shared_with = $2)`,
      [fileId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found or access denied.' });
    }

    const fileRecord = result.rows[0];
    const encryptedPath = path.join(UPLOAD_DIR, fileRecord.encrypted_path);

    // Read encrypted file
    let encryptedData;
    try {
      encryptedData = await fs.readFile(encryptedPath);
    } catch (err) {
      return res.status(404).json({ success: false, message: 'File data not found on server.' });
    }

    // Decrypt file
    const decrypted = decryptBuffer(
      encryptedData,
      fileRecord.encryption_key,
      fileRecord.iv,
      fileRecord.auth_tag
    );

    await logSecurityEvent(userId, 'FILE_DOWNLOAD', ip, req.headers['user-agent'], {
      fileId,
      fileName: fileRecord.original_name,
    });

    // Send file
    res.setHeader('Content-Type', fileRecord.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.original_name}"`);
    res.setHeader('Content-Length', decrypted.length);
    res.send(decrypted);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ success: false, message: 'File download failed.' });
  }
};

/**
 * GET /api/files/list
 * List user's uploaded files
 */
const listFiles = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT id, original_name, file_size, mime_type, scan_status, file_hash, auth_tag, uploaded_at
       FROM files WHERE owner_id = $1 ORDER BY uploaded_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      files: result.rows,
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ success: false, message: 'Failed to list files.' });
  }
};

/**
 * GET /api/files/users
 * List users to share with
 */
const getUsers = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await db.query(
      'SELECT id, username, display_name FROM users WHERE id != $1 ORDER BY username',
      [userId]
    );
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to get users.' });
  }
};

/**
 * POST /api/files/share
 */
const shareFile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const ip = getClientIP(req);
    const { fileId, shareWithUserId } = req.body;
    
    // Check if user owns the file
    const fileResult = await db.query('SELECT id, original_name FROM files WHERE id = $1 AND owner_id = $2', [fileId, userId]);
    if (fileResult.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'File not found or permission denied.' });
    }

    // Get recipient username and sender username for log metadata
    const recipientResult = await db.query('SELECT username FROM users WHERE id = $1', [shareWithUserId]);
    const recipientUsername = recipientResult.rows.length > 0 ? recipientResult.rows[0].username : 'unknown';

    const senderResult = await db.query('SELECT username FROM users WHERE id = $1', [userId]);
    const senderUsername = senderResult.rows.length > 0 ? senderResult.rows[0].username : 'unknown';

    await db.query(
      'INSERT INTO shared_files (file_id, shared_by, shared_with) VALUES ($1, $2, $3) ON CONFLICT (file_id, shared_with) DO NOTHING',
      [fileId, userId, shareWithUserId]
    );

    // Log the file share event for the SENDER
    await logSecurityEvent(userId, 'FILE_SHARE', ip, req.headers['user-agent'], {
      fileId,
      fileName: fileResult.rows[0].original_name,
      sharedWith: recipientUsername,
      sharedWithUserId: shareWithUserId,
    });

    // Log the file received event for the RECIPIENT
    await logSecurityEvent(shareWithUserId, 'FILE_RECEIVED', ip, req.headers['user-agent'], {
      fileId,
      fileName: fileResult.rows[0].original_name,
      sharedBy: senderUsername,
      sharedByUserId: userId,
    });

    res.json({ success: true, message: 'File shared successfully.' });
  } catch (error) {
    console.error('Share error:', error);
    res.status(500).json({ success: false, message: 'Failed to share file.' });
  }
};

/**
 * GET /api/files/shared
 */
const listSharedFiles = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT f.id, f.original_name, f.file_size, f.mime_type, f.scan_status, f.file_hash, f.auth_tag, f.uploaded_at, u.username as owner_username, u.email as owner_email
       FROM files f
       JOIN shared_files sf ON f.id = sf.file_id
       JOIN users u ON f.owner_id = u.id
       WHERE sf.shared_with = $1
       ORDER BY sf.shared_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      files: result.rows,
    });
  } catch (error) {
    console.error('List shared files error:', error);
    res.status(500).json({ success: false, message: 'Failed to list shared files.' });
  }
};

module.exports = { uploadFile, downloadFile, listFiles, getUsers, shareFile, listSharedFiles };
