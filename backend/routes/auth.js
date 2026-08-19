const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { logActivity } = require('../utils/audit');
require('dotenv').config();

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT u.*, r.role_name FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE (u.username = ? OR u.email = ?)`,
      [username, username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'This account has been deactivated. Contact your administrator.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const payload = {
      user_id: user.user_id,
      full_name: user.full_name,
      username: user.username,
      role_name: user.role_name,
      department_id: user.department_id
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret_change_me', { expiresIn: '8h' });

    await logActivity(user.user_id, 'LOGIN', `${user.username} logged in`);

    res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// POST /api/auth/register  (self-registration -> always created as Staff)
router.post('/register', async (req, res) => {
  const { full_name, username, email, password, department_id } = req.body;
  if (!full_name || !username || !email || !password || !department_id) {
    return res.status(400).json({ error: 'All fields, including department, are required.' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username or email already in use.' });
    }

    const [staffRole] = await pool.query("SELECT role_id FROM roles WHERE role_name = 'Staff'");
    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (full_name, username, email, password_hash, role_id, department_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [full_name, username, email, password_hash, staffRole[0].role_id, department_id || null]
    );

    await logActivity(result.insertId, 'REGISTER', `${username} self-registered as Staff`);

    res.status(201).json({ message: 'Account created. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /api/auth/forgot-password
// NOTE: This prototype has no email server configured, so instead of emailing the link,
// it returns the reset link directly in the API response so you can demo the full flow.
// In a real deployment, replace the "resetLink" response with an actual email send
// (e.g. via Nodemailer/SendGrid) and don't return the token to the client.
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const [rows] = await pool.query('SELECT user_id, username FROM users WHERE email = ?', [email]);

    // Always respond the same way whether or not the email exists, to avoid leaking
    // which emails are registered. The reset link is only included when a match is found.
    if (rows.length === 0) {
      return res.json({ message: 'If that email is registered, a reset link has been generated.' });
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?',
      [token, expires, user.user_id]
    );

    await logActivity(user.user_id, 'FORGOT_PASSWORD', `Reset requested for ${user.username}`);

    const resetLink = `${req.headers.origin || 'http://localhost:5173'}/reset-password?token=${token}`;

    res.json({
      message: 'If that email is registered, a reset link has been generated.',
      resetLink // shown in the UI for this prototype in place of an actual email
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while requesting password reset.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT user_id, username FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired. Request a new one.' });
    }

    const user = rows[0];
    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE user_id = ?',
      [password_hash, user.user_id]
    );

    await logActivity(user.user_id, 'RESET_PASSWORD', `${user.username} reset their password`);

    res.json({ message: 'Password updated. You can now log in with your new password.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while resetting password.' });
  }
});

module.exports = router;
