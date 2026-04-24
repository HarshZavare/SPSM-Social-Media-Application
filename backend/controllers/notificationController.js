const db = require('../config/db');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get unread count
    const countRes = await db.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    const unreadCount = parseInt(countRes.rows[0].count);

    // Get notifications
    const notifRes = await db.query(
      `SELECT n.*, u.username as from_username, u.avatar_url as from_avatar_url
       FROM notifications n
       LEFT JOIN users u ON n.from_user_id = u.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC, n.id DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), offset]
    );

    res.json({
      success: true,
      notifications: notifRes.rows,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.body;

    if (notificationId) {
      await db.query(
        'UPDATE notifications SET is_read = true WHERE user_id = $1 AND id = $2',
        [userId, notificationId]
      );
    } else {
      await db.query(
        'UPDATE notifications SET is_read = true WHERE user_id = $1',
        [userId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as read.' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
};
