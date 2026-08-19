const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logActivity } = require('../utils/audit');

const router = express.Router();
router.use(authenticate);

// GET /api/resources -- any authenticated user can view the catalogue
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM resources ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load resources.' });
  }
});

// POST /api/resources -- Administrator only
router.post('/', authorize('Administrator'), async (req, res) => {
  const { name, quantity, description, location } = req.body;
  if (!name) return res.status(400).json({ error: 'Resource name is required.' });

  try {
    const [result] = await pool.query(
      'INSERT INTO resources (name, quantity, description, location) VALUES (?, ?, ?, ?)',
      [name, quantity || 0, description || null, location || null]
    );
    await logActivity(req.user.user_id, 'CREATE_RESOURCE', `Created resource "${name}"`);
    res.status(201).json({ message: 'Resource added.', resource_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add resource.' });
  }
});

// PUT /api/resources/:id -- Administrator only
router.put('/:id', authorize('Administrator'), async (req, res) => {
  const { name, quantity, description, location, status } = req.body;
  try {
    await pool.query(
      'UPDATE resources SET name = ?, quantity = ?, description = ?, location = ?, status = ? WHERE resource_id = ?',
      [name, quantity, description, location, status, req.params.id]
    );
    await logActivity(req.user.user_id, 'UPDATE_RESOURCE', `Updated resource #${req.params.id}`);
    res.json({ message: 'Resource updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update resource.' });
  }
});

// DELETE /api/resources/:id -- Administrator only
router.delete('/:id', authorize('Administrator'), async (req, res) => {
  try {
    await pool.query('DELETE FROM resources WHERE resource_id = ?', [req.params.id]);
    await logActivity(req.user.user_id, 'DELETE_RESOURCE', `Deleted resource #${req.params.id}`);
    res.json({ message: 'Resource removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete resource.' });
  }
});

module.exports = router;
