const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/reports/summary -- counts by status (Manager/Administrator)
router.get('/summary', authorize('Manager', 'Administrator'), async (req, res) => {
  try {
    const [statusCounts] = await pool.query(
      `SELECT status, COUNT(*) AS count FROM requests GROUP BY status`
    );
    const [byDepartment] = await pool.query(
      `SELECT d.department_name, COUNT(rq.request_id) AS count
       FROM requests rq
       JOIN users u ON rq.user_id = u.user_id
       LEFT JOIN departments d ON u.department_id = d.department_id
       GROUP BY d.department_name`
    );
    const [topResources] = await pool.query(
      `SELECT resource_type, COUNT(*) AS count, SUM(quantity) AS total_quantity
       FROM requests GROUP BY resource_type ORDER BY count DESC LIMIT 5`
    );
    const [totals] = await pool.query('SELECT COUNT(*) AS total FROM requests');

    res.json({
      total: totals[0].total,
      statusCounts,
      byDepartment,
      topResources
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report.' });
  }
});

// GET /api/reports/export/requests-csv -- Download all requests in CSV format
router.get('/export/requests-csv', authorize('Manager', 'Administrator'), async (req, res) => {
  try {
    const [requests] = await pool.query(
      `SELECT r.request_id, r.resource_type, r.quantity, r.purpose, r.status, r.request_date,
              u.full_name AS requester_name, u.email AS requester_email, d.department_name
       FROM requests r
       JOIN users u ON r.user_id = u.user_id
       LEFT JOIN departments d ON u.department_id = d.department_id
       ORDER BY r.request_date DESC`
    );

    const headers = ['Request ID', 'Resource', 'Quantity', 'Requester Name', 'Email', 'Department', 'Purpose', 'Status', 'Request Date'];
    const rows = requests.map(r => [
      r.request_id,
      `"${(r.resource_type || '').replace(/"/g, '""')}"`,
      r.quantity,
      `"${(r.requester_name || '').replace(/"/g, '""')}"`,
      `"${(r.requester_email || '').replace(/"/g, '""')}"`,
      `"${(r.department_name || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(r.purpose || '').replace(/"/g, '""')}"`,
      r.status,
      new Date(r.request_date).toISOString().split('T')[0]
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=rram_requests_report_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export CSV report.' });
  }
});

// GET /api/reports/audit -- Administrator only
router.get('/audit', authorize('Administrator'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT al.*, u.full_name, u.username FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.user_id
       ORDER BY al.created_at DESC LIMIT 200`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load audit trail.' });
  }
});

module.exports = router;
