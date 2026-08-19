const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logActivity } = require('../utils/audit');

const router = express.Router();

// GET /api/departments -- PUBLIC (no auth) so the registration page can list them
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM departments ORDER BY department_name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load departments.' });
  }
});

// Everything below requires an authenticated Administrator
router.use(authenticate);
router.use(authorize('Administrator'));

// POST /api/departments
router.post('/', async (req, res) => {
  const { department_name, location, description } = req.body;
  if (!department_name) return res.status(400).json({ error: 'Department name is required.' });

  try {
    const [existing] = await pool.query('SELECT department_id FROM departments WHERE department_name = ?', [department_name]);
    if (existing.length > 0) return res.status(409).json({ error: 'A department with this name already exists.' });

    const [result] = await pool.query(
      'INSERT INTO departments (department_name, location, description) VALUES (?, ?, ?)',
      [department_name, location || null, description || null]
    );
    await logActivity(req.user.user_id, 'CREATE_DEPARTMENT', `Created department "${department_name}"`);
    res.status(201).json({ message: 'Department created.', department_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create department.' });
  }
});

// PUT /api/departments/:id
router.put('/:id', async (req, res) => {
  const { department_name, location, description } = req.body;
  if (!department_name) return res.status(400).json({ error: 'Department name is required.' });

  try {
    await pool.query(
      'UPDATE departments SET department_name = ?, location = ?, description = ? WHERE department_id = ?',
      [department_name, location || null, description || null, req.params.id]
    );
    await logActivity(req.user.user_id, 'UPDATE_DEPARTMENT', `Updated department #${req.params.id}`);
    res.json({ message: 'Department updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update department.' });
  }
});

// DELETE /api/departments/:id
router.delete('/:id', async (req, res) => {
  try {
    const [usersInDept] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE department_id = ?', [req.params.id]);
    if (usersInDept[0].count > 0) {
      return res.status(409).json({
        error: `Cannot delete: ${usersInDept[0].count} user(s) are still assigned to this department. Reassign them first.`
      });
    }

    await pool.query('DELETE FROM departments WHERE department_id = ?', [req.params.id]);
    await logActivity(req.user.user_id, 'DELETE_DEPARTMENT', `Deleted department #${req.params.id}`);
    res.json({ message: 'Department removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete department.' });
  }
});

module.exports = router;
