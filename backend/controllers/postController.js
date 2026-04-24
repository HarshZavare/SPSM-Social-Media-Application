const db = require('../config/db');

/**
 * POST /api/posts/create
 */
const createPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { caption, hashtags } = req.body;
    let image_url = null;
    
    if (req.file) {
      image_url = '/uploads/posts/' + req.file.filename;
    }

    const result = await db.query(
      'INSERT INTO posts (user_id, image_url, caption, hashtags) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, image_url, caption, hashtags]
    );

    res.json({ success: true, post: result.rows[0] });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: 'Failed to create post.' });
  }
};

/**
 * GET /api/posts/feed
 */
const getFeed = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await db.query(
      `SELECT 
          p.id, p.caption, p.image_url, p.hashtags, p.created_at,
          u.id as user_id, u.username, u.display_name, u.avatar_url,
          EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $1) as is_liked,
          (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count,
          (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) as comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN privacy_settings ps ON ps.user_id = u.id
       LEFT JOIN friendships f ON ((f.user_id = $1 AND f.friend_id = u.id) OR (f.user_id = u.id AND f.friend_id = $1)) AND f.status = 'accepted'
       WHERE 
         p.user_id = $1 OR 
         (COALESCE(ps.post_visibility, 'FRIENDS_ONLY') = 'PUBLIC') OR 
         (COALESCE(ps.post_visibility, 'FRIENDS_ONLY') = 'FRIENDS_ONLY' AND f.id IS NOT NULL)
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), offset]
    );

    // For each post, get the likers (up to 3 names)
    const posts = [];
    for (const post of result.rows) {
      const likersResult = await db.query(
        `SELECT u.username, u.display_name FROM post_likes pl
         JOIN users u ON pl.user_id = u.id
         WHERE pl.post_id = $1
         ORDER BY pl.created_at DESC LIMIT 3`,
        [post.id]
      );
      posts.push({
        ...post,
        recent_likers: likersResult.rows,
      });
    }

    res.json({ success: true, posts });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ success: false, message: 'Failed to get feed.' });
  }
};

/**
 * POST /api/posts/:id/like
 */
const likePost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const postId = req.params.id;
    await db.query(
      'INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [postId, userId]
    );

    // Get post owner to notify
    const postRes = await db.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (postRes.rows.length > 0 && postRes.rows[0].user_id !== userId) {
      await db.query(
        'INSERT INTO notifications (user_id, type, title, message, link, from_user_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [postRes.rows[0].user_id, 'post_like', 'New Like', `${req.user.username || 'Someone'} liked your post.`, '/feed', userId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, message: 'Failed to like post.' });
  }
};

/**
 * POST /api/posts/:id/unlike
 */
const unlikePost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const postId = req.params.id;
    await db.query(
      'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ success: false, message: 'Failed to unlike post.' });
  }
};

/**
 * POST /api/posts/:id/comment
 */
const commentPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const postId = req.params.id;
    const { content, parent_id } = req.body;

    if (!content) return res.status(400).json({ success: false, message: 'Comment content is required.' });

    const result = await db.query(
      'INSERT INTO post_comments (post_id, user_id, content, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [postId, userId, content, parent_id || null]
    );

    // Get post owner to notify
    const postRes = await db.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (postRes.rows.length > 0 && postRes.rows[0].user_id !== userId) {
      await db.query(
        'INSERT INTO notifications (user_id, type, title, message, link, from_user_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [postRes.rows[0].user_id, 'post_comment', 'New Comment', `${req.user.username || 'Someone'} commented on your post.`, '/feed', userId]
      );
    }

    res.json({ success: true, comment: result.rows[0] });
  } catch (error) {
    console.error('Comment post error:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment.' });
  }
};

/**
 * GET /api/posts/:id/comments
 */
const getComments = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT pc.id, pc.content, pc.created_at, pc.parent_id,
              u.id as user_id, u.username, u.display_name, u.avatar_url,
              EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = pc.id AND cl.user_id = $2) as is_liked,
              (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = pc.id) as likes_count,
              (SELECT COUNT(*) FROM post_comments r WHERE r.parent_id = pc.id) as replies_count
       FROM post_comments pc
       JOIN users u ON pc.user_id = u.id
       WHERE pc.post_id = $1
       ORDER BY pc.created_at ASC`,
      [postId, userId]
    );

    // Organize into top-level comments and replies
    const topLevel = [];
    const repliesMap = {};
    
    for (const c of result.rows) {
      if (c.parent_id) {
        if (!repliesMap[c.parent_id]) repliesMap[c.parent_id] = [];
        repliesMap[c.parent_id].push(c);
      } else {
        topLevel.push(c);
      }
    }

    const comments = topLevel.map(c => ({
      ...c,
      replies: repliesMap[c.id] || [],
    }));

    res.json({ success: true, comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: 'Failed to get comments.' });
  }
};

/**
 * POST /api/posts/comments/:commentId/like
 */
const likeComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const commentId = req.params.commentId;
    await db.query(
      'INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [commentId, userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to like comment.' });
  }
};

/**
 * POST /api/posts/comments/:commentId/unlike
 */
const unlikeComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const commentId = req.params.commentId;
    await db.query(
      'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      [commentId, userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Unlike comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to unlike comment.' });
  }
};

/**
 * GET /api/posts/user/:username/profile
 */
const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const userResult = await db.query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio, u.email, u.created_at, u.is_online, u.last_active_at,
              (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) as posts_count,
              (SELECT COUNT(*) FROM friendships f WHERE (f.user_id = u.id OR f.friend_id = u.id) AND f.status = 'accepted') as friends_count
       FROM users u WHERE u.username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const profile = userResult.rows[0];
    // Remove sensitive fields
    delete profile.email;

    res.json({ success: true, profile });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user profile.' });
  }
};

/**
 * GET /api/posts/user/:username/posts
 */
const getUserPosts = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { username } = req.params;

    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const targetUserId = userResult.rows[0].id;

    const result = await db.query(
      `SELECT 
          p.id, p.caption, p.image_url, p.hashtags, p.created_at,
          u.id as user_id, u.username, u.display_name, u.avatar_url,
          EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $1) as is_liked,
          (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count,
          (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) as comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $2
       ORDER BY p.created_at DESC`,
      [currentUserId, targetUserId]
    );

    // Get recent likers for each post
    const posts = [];
    for (const post of result.rows) {
      const likersResult = await db.query(
        `SELECT u.username, u.display_name FROM post_likes pl
         JOIN users u ON pl.user_id = u.id
         WHERE pl.post_id = $1
         ORDER BY pl.created_at DESC LIMIT 3`,
        [post.id]
      );
      posts.push({ ...post, recent_likers: likersResult.rows });
    }

    res.json({ success: true, posts });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user posts.' });
  }
};

module.exports = {
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
};
