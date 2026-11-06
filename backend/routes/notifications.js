const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { getEmailLogs, sendNotificationEmail } = require('../utils/email');

const router = express.Router();
router.use(authenticate);

// GET /api/notifications -- current user's notifications
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load notifications.' });
  }
});

// GET /api/notifications/email-logs -- view sent email notifications
router.get('/email-logs', (req, res) => {
  const logs = getEmailLogs();
  res.json(logs);
});

// POST /api/notifications/test-email -- send test email notification
router.post('/test-email', async (req, res) => {
  const recipient = req.body.email || req.user.email || 'user@example.com';
  const result = await sendNotificationEmail({
    to: recipient,
    subject: `[Ledger&Desk] Test Email Notification for ${req.user.full_name}`,
    text: `Hello ${req.user.full_name}, this is a test notification verifying that email delivery is active in Ledger&Desk.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-top: 0;">Test Notification Successful</h2>
        <p>Hello <strong>${req.user.full_name}</strong>,</p>
        <p>This email confirms that your Ledger&Desk email notification service is active and functioning properly.</p>
        <p style="font-size: 12px; color: #64748b;">Sent at ${new Date().toLocaleString()}</p>
      </div>
    `
  });
  res.json({ message: 'Test email notification dispatched.', result });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.user_id]);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

module.exports = router;
