const db = require('../config/db');

/**
 * Creates a notification
 */
const createNotification = async (userId, type, title, message, link = null, fromUserId = null) => {
  try {
    // Don't notify oneself
    if (userId === fromUserId) {
      console.log('Skipping self-notification for user:', userId);
      return;
    }
    
    console.log(`Creating notification: userId=${userId}, type=${type}, title=${title}, link=${link}, fromUserId=${fromUserId}`);
    
    const result = await db.query(
      'INSERT INTO notifications (user_id, type, title, message, link, from_user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [userId, type, title, message, link, fromUserId]
    );
    
    console.log('Notification created successfully:', result.rows[0]);
  } catch (err) {
    console.error('Create notification error:', err.message);
    console.error('Error details:', err);
  }
};

module.exports = {
  createNotification
};
