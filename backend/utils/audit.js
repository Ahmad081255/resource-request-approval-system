const pool = require('../config/db');

// 3.8.8 Activity Monitoring -- records user activity for the audit trail
async function logActivity(userId, action, details = '') {
  try {
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [userId, action, details]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = { logActivity };
