const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { logActivity } = require('../utils/audit');
const { authenticate } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/email');
require('dotenv').config();

const router = express.Router();

// GET /api/auth/me - Verify current session
router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.full_name, u.username, u.email, u.status, u.role_id, u.department_id, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [req.user.user_id]
    );

    if (rows.length === 0 || rows[0].status !== 'active') {
      return res.status(401).json({ error: 'User account not found or deactivated.' });
    }

    const user = rows[0];
    res.json({
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        role_name: user.role_name,
        department_id: user.department_id
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while verifying session.' });
  }
});

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

// POST /api/auth/forgot-password -- Generate 6-digit OTP and email it to the user
router.post('/forgot-password', async (req, res) => {
  const cleanEmail = (req.body.email || '').trim().toLowerCase();
  if (!cleanEmail) return res.status(400).json({ error: 'Email is required.' });

  try {
    const [rows] = await pool.query(
      "SELECT user_id, username, full_name, email FROM users WHERE LOWER(email) = LOWER(?) AND status = 'active'",
      [cleanEmail]
    );

    const genericMsg = 'If an active account matches that email, a 6-digit verification code has been sent to your inbox.';
    if (rows.length === 0) {
      return res.json({ message: genericMsg });
    }

    const user = rows[0];
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const tokenHash = crypto
      .createHash('sha256')
      .update(`${user.email.toLowerCase()}:${otpCode}`)
      .digest('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await pool.query(
      'UPDATE users SET reset_token = ?, reset_expires = ? WHERE user_id = ?',
      [tokenHash, expires, user.user_id]
    );

    await logActivity(user.user_id, 'FORGOT_PASSWORD', `6-digit reset code requested for ${user.username}`);

    await sendPasswordResetEmail({
      userEmail: user.email,
      userName: user.full_name || user.username,
      code: otpCode
    }).catch(err => console.error('[Email Notification Error]:', err.message));

    res.json({ message: genericMsg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while requesting password reset.' });
  }
});

// POST /api/auth/reset-password -- Verify 6-digit OTP (or legacy token) and update password in DB
router.post('/reset-password', async (req, res) => {
  const { email, code, token, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanCode = (code || '').trim();

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  try {
    let rows = [];

    if (cleanCode) {
      if (!cleanEmail || !/^\d{6}$/.test(cleanCode)) {
        return res.status(400).json({ error: 'Account email and a valid 6-digit verification code are required.' });
      }
      const tokenHash = crypto
        .createHash('sha256')
        .update(`${cleanEmail}:${cleanCode}`)
        .digest('hex');

      const now = new Date();
      [rows] = await pool.query(
        "SELECT user_id, username FROM users WHERE LOWER(email) = LOWER(?) AND reset_token = ? AND reset_expires > ? AND status = 'active'",
        [cleanEmail, tokenHash, now]
      );
    } else if (token) {
      const now = new Date();
      [rows] = await pool.query(
        "SELECT user_id, username FROM users WHERE reset_token = ? AND reset_expires > ? AND status = 'active'",
        [token, now]
      );
    } else {
      return res.status(400).json({ error: 'Email, 6-digit verification code, and new password are required.' });
    }

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Please check the code or request a new one.' });
    }

    const user = rows[0];
    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE user_id = ?',
      [password_hash, user.user_id]
    );

    await logActivity(user.user_id, 'RESET_PASSWORD', `${user.username} reset their password via verification code`);

    res.json({ message: 'Password updated successfully. You can now sign in with your new password.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while resetting password.' });
  }
});

// POST /api/auth/change-password -- Authenticated user updates their own password
router.post('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ error: 'New password must be different from your current password.' });
  }

  try {
    const [rows] = await pool.query('SELECT user_id, username, password_hash FROM users WHERE user_id = ?', [req.user.user_id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User account not found.' });

    const user = rows[0];
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [password_hash, user.user_id]);
    await logActivity(user.user_id, 'CHANGE_PASSWORD', `${user.username} updated their password`);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('[Change Password Error]:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

module.exports = router;
