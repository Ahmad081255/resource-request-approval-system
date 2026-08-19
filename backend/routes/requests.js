const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logActivity } = require('../utils/audit');

const router = express.Router();
router.use(authenticate);

// GET /api/requests -- Staff see only their own; Manager/Administrator see all
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT rq.*, u.full_name AS requester_name, d.department_name
      FROM requests rq
      JOIN users u ON rq.user_id = u.user_id
      LEFT JOIN departments d ON u.department_id = d.department_id
    `;
    const params = [];

    if (req.user.role_name === 'Staff') {
      query += ' WHERE rq.user_id = ?';
      params.push(req.user.user_id);
    }
    query += ' ORDER BY rq.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load requests.' });
  }
});

// GET /api/requests/:id -- single request with its approval history
router.get('/:id', async (req, res) => {
  try {
    const [reqRows] = await pool.query(
      `SELECT rq.*, u.full_name AS requester_name FROM requests rq
       JOIN users u ON rq.user_id = u.user_id WHERE rq.request_id = ?`,
      [req.params.id]
    );
    if (reqRows.length === 0) return res.status(404).json({ error: 'Request not found.' });

    const request = reqRows[0];
    if (req.user.role_name === 'Staff' && request.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'You can only view your own requests.' });
    }

    const [approvals] = await pool.query(
      `SELECT a.*, u.full_name AS approver_name FROM approvals a
       JOIN users u ON a.approver_id = u.user_id
       WHERE a.request_id = ? ORDER BY a.approval_date DESC`,
      [req.params.id]
    );

    res.json({ ...request, approvals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load request.' });
  }
});

// POST /api/requests -- Staff submits a new resource request
router.post('/', authorize('Staff', 'Manager', 'Administrator'), async (req, res) => {
  const { resource_type, resource_id, quantity, purpose } = req.body;
  if (!resource_type || !purpose || !quantity) {
    return res.status(400).json({ error: 'Resource type, quantity, and purpose are required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO requests (user_id, resource_type, resource_id, quantity, purpose, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [req.user.user_id, resource_type, resource_id || null, quantity, purpose]
    );

    // Notify all managers/administrators of the new request
    const [approvers] = await pool.query(
      `SELECT u.user_id FROM users u JOIN roles r ON u.role_id = r.role_id
       WHERE r.role_name IN ('Manager', 'Administrator') AND u.status = 'active'`
    );
    for (const a of approvers) {
      await pool.query(
        `INSERT INTO notifications (user_id, request_id, type, message) VALUES (?, ?, 'request_submitted', ?)`,
        [a.user_id, result.insertId, `${req.user.full_name} submitted a new request for ${resource_type}.`]
      );
    }

    await logActivity(req.user.user_id, 'SUBMIT_REQUEST', `Requested ${quantity} x ${resource_type}`);

    res.status(201).json({ message: 'Request submitted successfully.', request_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit request.' });
  }
});

// PATCH /api/requests/:id/decision -- Manager/Administrator approves, rejects, or requests modification
router.patch('/:id/decision', authorize('Manager', 'Administrator'), async (req, res) => {
  const { decision, remarks } = req.body; // 'approved' | 'rejected' | 'modification_requested'
  if (!['approved', 'rejected', 'modification_requested'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision value.' });
  }

  try {
    const [reqRows] = await pool.query('SELECT * FROM requests WHERE request_id = ?', [req.params.id]);
    if (reqRows.length === 0) return res.status(404).json({ error: 'Request not found.' });
    const request = reqRows[0];

    await pool.query('UPDATE requests SET status = ? WHERE request_id = ?', [decision, req.params.id]);

    await pool.query(
      `INSERT INTO approvals (request_id, approver_id, decision, remarks) VALUES (?, ?, ?, ?)`,
      [req.params.id, req.user.user_id, decision, remarks || null]
    );

    const label = decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : 'sent back for modification';
    await pool.query(
      `INSERT INTO notifications (user_id, request_id, type, message) VALUES (?, ?, 'decision', ?)`,
      [request.user_id, req.params.id, `Your request for ${request.resource_type} was ${label} by ${req.user.full_name}.`]
    );

    await logActivity(req.user.user_id, 'REQUEST_DECISION', `Request #${req.params.id} marked ${decision}`);

    res.json({ message: `Request ${label}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record decision.' });
  }
});

module.exports = router;
