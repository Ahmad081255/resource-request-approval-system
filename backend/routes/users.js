const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logActivity } = require('../utils/audit');

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

// POST /api/users -- Administrator creates a user with a specific role
router.post('/', authorize('Administrator'), async (req, res) => {
  const { full_name, username, email, password, role_id, department_id } = req.body;
  if (!full_name || !username || !email || !password || !role_id) {
    return res.status(400).json({ error: 'All fields except department are required.' });
  }

  try {
    const [existing] = await pool.query('SELECT user_id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) return res.status(409).json({ error: 'Username or email already in use.' });

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (full_name, username, email, password_hash, role_id, department_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [full_name, username, email, password_hash, role_id, department_id || null]
    );

    await logActivity(req.user.user_id, 'CREATE_USER', `Created user "${username}"`);
    res.status(201).json({ message: 'User created.', user_id: result.insertId });
  } catch (err) {
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
