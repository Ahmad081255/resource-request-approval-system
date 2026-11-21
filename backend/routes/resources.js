const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logActivity } = require('../utils/audit');

const router = express.Router();
router.use(authenticate);

// GET /api/resources -- any authenticated user can view the catalogue
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT resource_id,
              name,
              category,
              category AS location,
              description,
              available_quantity,
              available_quantity AS quantity,
              unit,
              is_active,
              IF(is_active, 'available', 'unavailable') AS status,
              created_at
       FROM resources
       ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    console.error('[Resources GET Error]:', err);
    res.status(500).json({ error: 'Failed to load resources.' });
  }
});

// POST /api/resources -- Administrator only
router.post('/', authorize('Administrator'), async (req, res) => {
  const { name, quantity, available_quantity, description, location, category, unit } = req.body;
  if (!name) return res.status(400).json({ error: 'Resource name is required.' });

  const stockQty = Number(quantity ?? available_quantity ?? 0) || 0;
  const resourceCategory = (location || category || 'General').trim();
  const resourceUnit = (unit || 'units').trim();

  try {
    const [result] = await pool.query(
      `INSERT INTO resources (name, category, description, available_quantity, unit, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [name, resourceCategory, description || null, stockQty, resourceUnit]
    );
    await logActivity(req.user.user_id, 'CREATE_RESOURCE', `Created resource "${name}"`);
    res.status(201).json({ message: 'Resource added.', resource_id: result.insertId });
  } catch (err) {
    console.error('[Resources POST Error]:', err);
    res.status(500).json({ error: 'Failed to add resource.' });
  }
});

// PUT /api/resources/:id -- Administrator only
router.put('/:id', authorize('Administrator'), async (req, res) => {
  const { name, quantity, available_quantity, description, location, category, status, is_active } = req.body;
  const stockQty = Number(quantity ?? available_quantity ?? 0) || 0;
  const resourceCategory = (location || category || 'General').trim();
  const activeFlag =
    typeof is_active === 'boolean' || typeof is_active === 'number'
      ? (is_active ? 1 : 0)
      : status === 'unavailable'
      ? 0
      : 1;

  try {
    await pool.query(
      `UPDATE resources
       SET name = ?, category = ?, description = ?, available_quantity = ?, is_active = ?
       WHERE resource_id = ?`,
      [name, resourceCategory, description || null, stockQty, activeFlag, req.params.id]
    );
    await logActivity(req.user.user_id, 'UPDATE_RESOURCE', `Updated resource #${req.params.id}`);
    res.json({ message: 'Resource updated.' });
  } catch (err) {
    console.error('[Resources PUT Error]:', err);
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
    console.error('[Resources DELETE Error]:', err);
    res.status(500).json({ error: 'Failed to delete resource.' });
  }
});

module.exports = router;
