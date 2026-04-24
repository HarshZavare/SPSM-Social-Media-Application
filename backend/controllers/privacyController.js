const db = require('../config/db');
const { logSecurityEvent } = require('../services/loggingService');
const { getClientIP } = require('../utils/helpers');

/**
 * GET /api/privacy/settings
 */
const getPrivacySettings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      'SELECT profile_visibility, post_visibility, contact_visibility, last_seen_visibility, updated_at FROM privacy_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default settings
      await db.query(
        `INSERT INTO privacy_settings (user_id) VALUES ($1)`,
        [userId]
      );
      return res.json({
        success: true,
        settings: {
          profile_visibility: 'PUBLIC',
          post_visibility: 'FRIENDS_ONLY',
          contact_visibility: 'PRIVATE',
          last_seen_visibility: 'FRIENDS_ONLY',
        },
      });
    }

    res.json({ success: true, settings: result.rows[0] });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get privacy settings.' });
  }
};

/**
 * PUT /api/privacy/settings
 */
const updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { profile_visibility, post_visibility, contact_visibility, last_seen_visibility } = req.body;
    const ip = getClientIP(req);

    const result = await db.query(
      `INSERT INTO privacy_settings (user_id, profile_visibility, post_visibility, contact_visibility, last_seen_visibility, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         profile_visibility = COALESCE($2, privacy_settings.profile_visibility),
         post_visibility = COALESCE($3, privacy_settings.post_visibility),
         contact_visibility = COALESCE($4, privacy_settings.contact_visibility),
         last_seen_visibility = COALESCE($5, privacy_settings.last_seen_visibility),
         updated_at = NOW()
       RETURNING *`,
      [userId, profile_visibility, post_visibility, contact_visibility, last_seen_visibility]
    );

    await logSecurityEvent(userId, 'PRIVACY_UPDATE', ip, req.headers['user-agent'], {
      profile_visibility,
      post_visibility,
      contact_visibility,
      last_seen_visibility,
    });

    res.json({
      success: true,
      message: 'Privacy settings updated.',
      settings: result.rows[0],
    });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update privacy settings.' });
  }
};

/**
 * GET /api/profile/view/:userId
 * View a user's profile, respecting privacy settings
 */
const viewProfile = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const viewerId = req.user ? req.user.userId : null;
    const isSelf = viewerId === targetUserId;

    // Get user data
    const userResult = await db.query(
      'SELECT id, username, display_name, avatar_url, bio, created_at FROM users WHERE id = $1',
      [targetUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = userResult.rows[0];

    // If viewing own profile, return everything
    if (isSelf) {
      return res.json({ success: true, profile: user, privacy: 'self' });
    }

    // Get privacy settings
    const privacyResult = await db.query(
      'SELECT * FROM privacy_settings WHERE user_id = $1',
      [targetUserId]
    );

    const privacy = privacyResult.rows[0] || {
      profile_visibility: 'PUBLIC',
      post_visibility: 'FRIENDS_ONLY',
      contact_visibility: 'PRIVATE',
    };

    // Check friendship status
    let isFriend = false;
    if (viewerId) {
      const friendResult = await db.query(
        `SELECT id FROM friendships 
         WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
         AND status = 'accepted'`,
        [viewerId, targetUserId]
      );
      isFriend = friendResult.rows.length > 0;
    }

    // Apply privacy rules
    const canViewProfile = privacy.profile_visibility === 'PUBLIC' ||
      (privacy.profile_visibility === 'FRIENDS_ONLY' && isFriend) ||
      isSelf;

    if (!canViewProfile) {
      return res.json({
        success: true,
        profile: { id: user.id, username: user.username, display_name: user.display_name },
        restricted: true,
        message: 'This profile is private.',
      });
    }

    // Build response based on privacy levels
    const profile = {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      created_at: user.created_at,
    };

    // Contact visibility
    if (privacy.contact_visibility === 'PRIVATE' && !isSelf) {
      delete profile.email;
    } else if (privacy.contact_visibility === 'FRIENDS_ONLY' && !isFriend) {
      delete profile.email;
    }

    res.json({
      success: true,
      profile,
      privacy: {
        canViewPosts: privacy.post_visibility === 'PUBLIC' || (privacy.post_visibility === 'FRIENDS_ONLY' && isFriend),
        canViewContact: privacy.contact_visibility === 'PUBLIC' || (privacy.contact_visibility === 'FRIENDS_ONLY' && isFriend),
      },
    });
  } catch (error) {
    console.error('View profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to load profile.' });
  }
};

module.exports = { getPrivacySettings, updatePrivacySettings, viewProfile };
