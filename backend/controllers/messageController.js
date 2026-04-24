const db = require('../config/db');
const { encrypt, decrypt, deriveConversationKey } = require('../services/encryptionService');
const { logSecurityEvent } = require('../services/loggingService');
const { createNotification } = require('../services/notificationService');
const { getClientIP } = require('../utils/helpers');

/**
 * POST /api/messages/send
 */
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverId, content } = req.body;
    const ip = getClientIP(req);

    // Verify receiver exists
    const receiverResult = await db.query('SELECT id FROM users WHERE id = $1', [receiverId]);
    if (receiverResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Recipient not found.' });
    }

    // Cannot send message to self
    if (senderId === receiverId) {
      return res.status(400).json({ success: false, message: 'Cannot send message to yourself.' });
    }

    // Verify friendship
    const friendResult = await db.query(
      `SELECT id FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)) 
       AND status = 'accepted'`,
      [senderId, receiverId]
    );

    if (friendResult.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'You can only send messages to confirmed friends.' });
    }

    // Derive conversation key
    const conversationKey = deriveConversationKey(senderId, receiverId);

    // Encrypt message
    const { encrypted, iv, authTag } = encrypt(content, Buffer.from(conversationKey));

    // Store encrypted message
    const result = await db.query(
      `INSERT INTO messages (sender_id, receiver_id, encrypted_message, iv, auth_tag)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, timestamp`,
      [senderId, receiverId, encrypted, iv, authTag]
    );

    await logSecurityEvent(senderId, 'MESSAGE_SENT', ip, req.headers['user-agent'], {
      receiverId,
      messageId: result.rows[0].id,
    });

    // Create notification using service
    console.log(`Message from ${req.user.username} (${senderId}) to ${receiverId}, creating notification...`);
    await createNotification(
      receiverId,
      'new_message',
      'New Message',
      `You received a new message from ${req.user.username || 'Someone'}.`,
      `/messages`,
      senderId
    );
    console.log(`Notification creation completed for receiverId: ${receiverId}`);

    res.status(201).json({
      success: true,
      message: 'Message sent securely.',
      data: {
        id: result.rows[0].id,
        timestamp: result.rows[0].timestamp,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};

/**
 * GET /api/messages/get/:userId
 * Get conversation with a specific user
 */
const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.userId;
    const { page = 1, limit = 50 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Mark messages as read
    await db.query(
      `UPDATE messages SET status = 'read' WHERE receiver_id = $1 AND sender_id = $2 AND status != 'read'`,
      [currentUserId, otherUserId]
    );

    // Get messages between the two users
    const result = await db.query(
      `SELECT m.*, 
              u1.username as sender_username,
              u2.username as receiver_username
       FROM messages m
       JOIN users u1 ON m.sender_id = u1.id
       JOIN users u2 ON m.receiver_id = u2.id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2) 
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.timestamp ASC
       LIMIT $3 OFFSET $4`,
      [currentUserId, otherUserId, parseInt(limit), offset]
    );

    // Derive conversation key
    const conversationKey = deriveConversationKey(currentUserId, otherUserId);

    // Decrypt messages
    const messages = result.rows.map(msg => {
      try {
        const decryptedContent = decrypt(
          msg.encrypted_message,
          Buffer.from(conversationKey),
          msg.iv,
          msg.auth_tag
        );
        return {
          id: msg.id,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          senderUsername: msg.sender_username,
          content: decryptedContent,
          timestamp: msg.timestamp,
          isOwn: msg.sender_id === currentUserId,
          status: msg.status,
        };
      } catch (decryptError) {
        return {
          id: msg.id,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          senderUsername: msg.sender_username,
          content: '[Unable to decrypt message]',
          timestamp: msg.timestamp,
          isOwn: msg.sender_id === currentUserId,
          decryptionError: true,
        };
      }
    });

    res.json({
      success: true,
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: messages.length,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve messages.' });
  }
};

/**
 * GET /api/messages/conversations
 * Get list of friends (conversations) for the current user
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch all accepted friends and get their last message timestamp if exists
    const result = await db.query(
      `SELECT 
        u.id as other_user_id,
        u.username as other_username,
        u.display_name as other_display_name,
        u.avatar_url as other_avatar,
        CASE 
          WHEN ps.last_seen_visibility = 'PRIVATE' THEN NULL
          ELSE u.last_active_at
        END as last_active_at,
        CASE
          WHEN ps.last_seen_visibility = 'PRIVATE' THEN false
          WHEN u.is_online = false THEN false
          WHEN u.last_active_at IS NULL THEN false
          WHEN u.last_active_at > NOW() - interval '2 minutes' THEN true
          ELSE false
        END as is_online,
        MAX(m.timestamp) as last_message_at
       FROM users u
       JOIN friendships f 
         ON ((f.user_id = $1 AND f.friend_id = u.id) OR (f.user_id = u.id AND f.friend_id = $1)) 
         AND f.status = 'accepted'
       LEFT JOIN privacy_settings ps ON ps.user_id = u.id
       LEFT JOIN messages m 
         ON ((m.sender_id = $1 AND m.receiver_id = u.id) OR (m.sender_id = u.id AND m.receiver_id = $1))
       WHERE u.id != $1
       GROUP BY u.id, ps.last_seen_visibility
       ORDER BY last_message_at DESC NULLS LAST, u.username ASC`,
      [userId]
    );

    res.json({
      success: true,
      conversations: result.rows,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve conversations.' });
  }
};

module.exports = { sendMessage, getMessages, getConversations };
