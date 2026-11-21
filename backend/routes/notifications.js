const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getEmailLogs,
  sendNotificationEmail,
  sendNewRequestEmail,
  sendRequestDecisionEmail,
  getSafeConfig,
  saveConfig,
  verifyConfig
} = require('../utils/email');

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

// GET /api/notifications/email-logs -- view sent email notifications outbox
router.get('/email-logs', (req, res) => {
  const logs = getEmailLogs();
  res.json(logs);
});

// GET /api/notifications/mailtrap-config -- view current SMTP/Mailtrap setup
router.get('/mailtrap-config', (req, res) => {
  const config = getSafeConfig();
  res.json(config);
});

// POST /api/notifications/mailtrap-config -- save Mailtrap / SMTP credentials (Administrator only)
router.post('/mailtrap-config', authorize('Administrator', 'Manager'), async (req, res) => {
  const { host, port, secure, user, pass, from } = req.body;

  try {
    const result = await saveConfig({ host, port, secure, user, pass, from });
    res.json(result);
  } catch (err) {
    console.error('[Mailtrap Config Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to save Mailtrap configuration.' });
  }
});

// POST /api/notifications/mailtrap-verify -- live test SMTP connection (Administrator only)
router.post('/mailtrap-verify', authorize('Administrator', 'Manager'), async (req, res) => {
  const { host, port, secure, user, pass } = req.body;

  const result = await verifyConfig({ host, port, secure, user, pass });
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// POST /api/notifications/test-email -- send basic test email notification
router.post('/test-email', async (req, res) => {
  const recipient = req.body.email || req.user.email || 'user@example.com';
  const result = await sendNotificationEmail({
    to: recipient,
    subject: `[RRAM] Test Email Notification for ${req.user.full_name}`,
    eventType: 'test',
    text: `Hello ${req.user.full_name}, this is a test notification verifying that email delivery is active in RRAM.`,
    html: `
      <div style="font-family: sans-serif; padding: 24px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; max-width: 540px;">
        <div style="background: #4f46e5; color: #ffffff; padding: 14px 18px; border-radius: 8px; margin-bottom: 18px;">
          <h2 style="margin: 0; font-size: 16px;">Mailtrap Delivery Verification</h2>
        </div>
        <p style="font-size: 14px; color: #1e293b; margin-top: 0;">Hello <strong>${req.user.full_name}</strong>,</p>
        <p style="font-size: 13px; color: #475569; line-height: 1.5;">This email confirms that your RRAM email notification engine is connected and delivering emails.</p>
        <div style="background: #f1f5f9; padding: 10px 14px; border-radius: 6px; font-family: monospace; font-size: 12px; color: #334155; margin: 14px 0;">
          Recipient: ${recipient}<br/>
          Time: ${new Date().toLocaleString()}<br/>
          Engine: Mailtrap Ready
        </div>
        <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">RRAM System · Resource Request & Approval Management</p>
      </div>
    `
  });
  res.json({ message: 'Test email notification dispatched.', result });
});

// POST /api/notifications/send-sample-event -- dispatch sample workflow email (approval, rejection, or new request)
router.post('/send-sample-event', authorize('Administrator', 'Manager'), async (req, res) => {
  const { eventType, recipientEmail } = req.body;
  const targetEmail = recipientEmail || req.user.email || 'staff@miva.edu.ng';
  const appUrl = `${req.protocol}://${req.get('host')}`;

  try {
    let result;
    if (eventType === 'request_submitted') {
      result = await sendNewRequestEmail({
        approverEmail: targetEmail,
        approverName: req.user.full_name,
        requesterName: 'Sarah Jenkins',
        requesterDepartment: 'Operations',
        resourceType: 'Dell UltraSharp 27" Monitor',
        quantity: 2,
        purpose: 'Workstation upgrade for Q4 data analysis deliverables.',
        requestId: 4001,
        appUrl
      });
    } else if (eventType === 'approved') {
      result = await sendRequestDecisionEmail({
        requesterEmail: targetEmail,
        requesterName: 'Sarah Jenkins',
        resourceType: 'MacBook Pro 14" M3',
        quantity: 1,
        decision: 'approved',
        remarks: 'Approved under Department Hardware Refresh Budget 2026. Please collect from IT Store on Monday.',
        approverName: req.user.full_name,
        requestId: 4002,
        appUrl
      });
    } else if (eventType === 'rejected') {
      result = await sendRequestDecisionEmail({
        requesterEmail: targetEmail,
        requesterName: 'Sarah Jenkins',
        resourceType: 'Executive Leather Recliner',
        quantity: 1,
        decision: 'rejected',
        remarks: 'Item is not on the standard office supply schedule. Please request standard Ergonomic Mesh Chair instead.',
        approverName: req.user.full_name,
        requestId: 4003,
        appUrl
      });
    } else if (eventType === 'modification_requested') {
      result = await sendRequestDecisionEmail({
        requesterEmail: targetEmail,
        requesterName: 'Sarah Jenkins',
        resourceType: 'Dell UltraSharp 27" Monitor',
        quantity: 4,
        decision: 'modification_requested',
        remarks: 'Quantity exceeds per-staff allocation limit (max 2). Please revise quantity to 2 and re-submit.',
        approverName: req.user.full_name,
        requestId: 4004,
        appUrl
      });
    } else {
      return res.status(400).json({ error: 'Invalid eventType. Use request_submitted, approved, rejected, or modification_requested.' });
    }

    res.json({
      message: `Sample ${eventType} email dispatched. Check your Mailtrap Inbox!`,
      result
    });
  } catch (err) {
    console.error('[Sample Email Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to dispatch sample email.' });
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

module.exports = router;
