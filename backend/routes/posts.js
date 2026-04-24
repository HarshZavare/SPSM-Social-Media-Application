const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  createPost, 
  getFeed, 
  likePost, 
  unlikePost, 
  commentPost, 
  getComments,
  likeComment,
  unlikeComment,
  getUserProfile,
  getUserPosts,
} = require('../controllers/postController');
const { authenticateToken } = require('../middleware/auth');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/posts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

router.use(authenticateToken);

router.post('/create', upload.single('image'), createPost);
router.get('/feed', getFeed);
router.get('/user/:username/profile', getUserProfile);
router.get('/user/:username/posts', getUserPosts);
router.post('/comments/:commentId/like', likeComment);
router.post('/comments/:commentId/unlike', unlikeComment);
router.post('/:id/like', likePost);
router.post('/:id/unlike', unlikePost);
router.post('/:id/comment', commentPost);
router.get('/:id/comments', getComments);

module.exports = router;
