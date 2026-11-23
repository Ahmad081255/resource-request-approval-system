const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logActivity } = require('../utils/audit');
const { sendAccountCreatedEmail } = require('../utils/email');

const router = express.Router();
router.use(authenticate);

// GET /api/users -- Administrator only: list all users
router.get('/', authorize('Administrator'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.full_name, u.username, u.email, u.status, u.created_at,
              r.role_name, d.department_name, u.role_id, u.department_id
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN departments d ON u.department_id = d.department_id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load users.' });
  }
});

// GET /api/users/meta -- roles & departments for dropdowns (any authenticated user)
router.get('/meta/lookup', async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT * FROM roles ORDER BY role_id');
    const [departments] = await pool.query('SELECT * FROM departments ORDER BY department_name');
    res.json({ roles, departments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load lookup data.' });
  }
});

// GET /api/users/dashboard/stats -- dashboard KPI counts & department breakdown
router.get('/dashboard/stats', async (req, res) => {
  try {
    const isStaff = req.user.role_name === 'Staff';
    const whereClause = isStaff ? 'WHERE user_id = ?' : '';
    const params = isStaff ? [req.user.user_id] : [];

    const [statusRows] = await pool.query(
      `SELECT status, COUNT(*) AS count FROM requests ${whereClause} GROUP BY status`,
      params
    );

    const stats = {
      pending: 0,
      approved: 0,
      modification_requested: 0,
      rejected: 0,
      total: 0,
      byDepartment: []
    };

    for (const row of statusRows) {
      const count = Number(row.count) || 0;
      stats.total += count;
      if (Object.prototype.hasOwnProperty.call(stats, row.status) && row.status !== 'total' && row.status !== 'byDepartment') {
        stats[row.status] = count;
      }
    }

    if (!isStaff) {
      const [deptRows] = await pool.query(
        `SELECT COALESCE(d.department_name, 'Unassigned') AS department_name,
                COUNT(rq.request_id) AS count
         FROM requests rq
         JOIN users u ON rq.user_id = u.user_id
         LEFT JOIN departments d ON u.department_id = d.department_id
         GROUP BY d.department_name
         ORDER BY count DESC`
      );
      stats.byDepartment = deptRows.map((d) => ({
        department_name: d.department_name,
        count: Number(d.count) || 0
      }));
    }

    res.json(stats);
  } catch (err) {
    console.error('[Dashboard Stats Error]:', err);
    res.status(500).json({ error: 'Failed to load dashboard statistics.' });
  }
});

// POST /api/users -- Administrator creates a user with a specific role
router.post('/', authorize('Administrator'), async (req, res) => {
  const fullName = (req.body.full_name || '').trim();
  const username = (req.body.username || '').trim();
  const email = (req.body.email || '').trim();
  const password = req.body.password || '';
  const { role_id, department_id } = req.body;

  if (!fullName || !username || !email || !password || !role_id) {
    return res.status(400).json({ error: 'All fields except department are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Temporary password must be at least 6 characters.' });
  }

  try {
    const [existing] = await pool.query('SELECT user_id FROM users WHERE username = ? OR LOWER(email) = LOWER(?)', [username, email]);
    if (existing.length > 0) return res.status(409).json({ error: 'Username or email already in use.' });

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (full_name, username, email, password_hash, role_id, department_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [fullName, username, email, password_hash, role_id, department_id || null]
    );

    const [roleRows] = await pool.query('SELECT role_name FROM roles WHERE role_id = ?', [role_id]);
    const roleName = roleRows[0]?.role_name || 'Staff';

    let departmentName = '';
    if (department_id) {
      const [deptRows] = await pool.query('SELECT department_name FROM departments WHERE department_id = ?', [department_id]);
      departmentName = deptRows[0]?.department_name || '';
    }

    const baseUrl = req.headers.origin || `${req.get('x-forwarded-proto') || req.protocol}://${req.get('host')}`;
    const loginUrl = `${baseUrl}/login`;

    const emailResult = await sendAccountCreatedEmail({
      userEmail: email,
      fullName,
      username,
      temporaryPassword: password,
      roleName,
      departmentName,
      loginUrl
    }).catch(err => ({ success: false, error: err.message }));

    await logActivity(req.user.user_id, 'CREATE_USER', `Created user "${username}" (${roleName})`);
    res.status(201).json({
      message: emailResult?.success
        ? `User created and credentials emailed to ${email}.`
        : 'User created, but the credentials email could not be delivered.',
      user_id: result.insertId,
      emailSent: Boolean(emailResult?.success),
      emailError: emailResult?.success ? null : (emailResult?.error || 'Email delivery failed')
    });
  } catch (err) {
    console.error('[Create User Error]:', err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// PATCH /api/users/:id -- Administrator updates role/department/status
router.patch('/:id', authorize('Administrator'), async (req, res) => {
  const { role_id, department_id, status } = req.body;
  try {
    await pool.query(
      'UPDATE users SET role_id = COALESCE(?, role_id), department_id = ?, status = COALESCE(?, status) WHERE user_id = ?',
      [role_id || null, department_id || null, status || null, req.params.id]
    );
    await logActivity(req.user.user_id, 'UPDATE_USER', `Updated user #${req.params.id}`);
    res.json({ message: 'User updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// DELETE /api/users/:id -- Administrator deactivates a user (soft delete)
router.delete('/:id', authorize('Administrator'), async (req, res) => {
  try {
    await pool.query("UPDATE users SET status = 'inactive' WHERE user_id = ?", [req.params.id]);
    await logActivity(req.user.user_id, 'DEACTIVATE_USER', `Deactivated user #${req.params.id}`);
    res.json({ message: 'User deactivated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate user.' });
  }
});

module.exports = router;
