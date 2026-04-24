const db = require('../config/db');

/**
 * GET /api/friends/users
 * List all users and current friendship status
 */
const listUsers = async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = `
      SELECT 
        u.id, 
        u.username, 
        u.email,
        u.display_name, 
        f.status, 
        f.user_id as requester_id
      FROM users u
      LEFT JOIN friendships f 
        ON (f.user_id = $1 AND f.friend_id = u.id) 
        OR (f.user_id = u.id AND f.friend_id = $1)
      WHERE u.id != $1
      ORDER BY u.username
    `;
    
    const result = await db.query(query, [userId]);
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

/**
 * POST /api/friends/request
 * Send a friend request
 */
const sendRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { friendId } = req.body;

    if (userId === friendId) {
      return res.status(400).json({ success: false, message: 'Cannot send request to yourself' });
    }

    // Check if relationship already exists
    const check = await db.query(
      'SELECT id FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
      [userId, friendId]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Friendship or pending request already exists' });
    }

    await db.query(
      'INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, $3)',
      [userId, friendId, 'pending']
    );

    // Create notification
    await db.query(
      'INSERT INTO notifications (user_id, type, title, message, link, from_user_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [friendId, 'friend_request', 'New Friend Request', `${req.user.username || 'Someone'} sent you a friend request.`, '/friends', userId]
    );

    res.json({ success: true, message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ success: false, message: 'Failed to send friend request' });
  }
};

/**
 * PUT /api/friends/accept
 * Accept a friend request
 */
const acceptRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requesterId } = req.body;

    const result = await db.query(
      'UPDATE friendships SET status = $1 WHERE user_id = $2 AND friend_id = $3 AND status = $4 RETURNING id',
      ['accepted', requesterId, userId, 'pending']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pending request not found' });
    }

    // Create notification
    await db.query(
      'INSERT INTO notifications (user_id, type, title, message, link, from_user_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [requesterId, 'friend_accept', 'Friend Request Accepted', `${req.user.username || 'Someone'} accepted your friend request.`, '/friends', userId]
    );

    res.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept friend request' });
  }
};

/**
 * POST /api/friends/reject
 * Reject a friend request (deletes the pending record)
 */
const rejectRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requesterId } = req.body;

    const result = await db.query(
      'DELETE FROM friendships WHERE user_id = $1 AND friend_id = $2 AND status = $3 RETURNING id',
      [requesterId, userId, 'pending']
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Pending request not found' });
    }

    res.json({ success: true, message: 'Friend request rejected' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject friend request' });
  }
};

module.exports = {
  listUsers,
  sendRequest,
  acceptRequest,
  rejectRequest
};
