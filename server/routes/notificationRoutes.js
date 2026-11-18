const express = require('express');
const router = express.Router();
const { query } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Get notifications for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    let sql = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [req.user.id];

    if (unreadOnly) {
      sql += ' AND is_read = 0';
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const notifications = await query.all(sql, params);
    const parsed = notifications.map(n => ({
      ...n,
      is_read: Boolean(n.is_read),
      metadata: n.metadata ? JSON.parse(n.metadata) : null
    }));

    res.json(parsed);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// Mark single notification as read
router.post('/:id/read', authenticateToken, async (req, res) => {
  try {
    await query.run(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification read.' });
  }
});

// Mark all as read
router.post('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await query.run(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all read.' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await query.run(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification.' });
  }
});

module.exports = router;

