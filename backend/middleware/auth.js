const jwt = require('jsonwebtoken');
require('dotenv').config();

// 3.8.1 User Authentication -- verifies the JWT issued at login
function authenticate(req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    }
    req.user = decoded; // { user_id, role_name, full_name, department_id }
    next();
  });
}

// 3.8.2 Role-Based Access Control -- restricts a route to specific roles
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role_name)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
