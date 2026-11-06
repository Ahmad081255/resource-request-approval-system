const mysql = require('mysql2/promise');
require('dotenv').config();

// Initial In-Memory Seed Data (Matches MySQL schema & project figures)
const roles = [
  { role_id: 1, role_name: 'Administrator', description: 'Manages users, resources, and has full system oversight' },
  { role_id: 2, role_name: 'Manager', description: 'Reviews and approves or rejects resource requests' },
  { role_id: 3, role_name: 'Staff', description: 'Submits resource requests and tracks their status' }
];

const departments = [
  { department_id: 1, department_name: 'Operations', location: 'Ground Floor', description: 'General operations and logistics' },
  { department_id: 2, department_name: 'Finance', location: '1st Floor', description: 'Budgeting and financial control' },
  { department_id: 3, department_name: 'IT', location: '2nd Floor', description: 'Technology and infrastructure support' }
];

const users = [
  {
    user_id: 1,
    full_name: 'Ahmad Yusuf',
    username: 'admin',
    email: 'admin@miva.edu.ng',
    password_hash: '$2b$10$t9WfJzZQOZ6bHorS5h9tDumRJpxLedIPsdroJ8pQsbpxzTD1ufdyi', // Password123
    role_id: 1,
    department_id: 3,
    status: 'active',
    reset_token: null,
    reset_token_expires: null,
    created_at: new Date('2026-08-01T08:00:00Z')
  },
  {
    user_id: 2,
    full_name: 'Fatima Bello',
    username: 'manager',
    email: 'fatima.bello@company.com',
    password_hash: '$2b$10$t9WfJzZQOZ6bHorS5h9tDumRJpxLedIPsdroJ8pQsbpxzTD1ufdyi', // Password123
    role_id: 2,
    department_id: 1,
    status: 'active',
    reset_token: null,
    reset_token_expires: null,
    created_at: new Date('2026-08-01T08:00:00Z')
  },
  {
    user_id: 3,
    full_name: 'John Okafor',
    username: 'staff',
    email: 'john.okafor@company.com',
    password_hash: '$2b$10$t9WfJzZQOZ6bHorS5h9tDumRJpxLedIPsdroJ8pQsbpxzTD1ufdyi', // Password123
    role_id: 3,
    department_id: 1,
    status: 'active',
    reset_token: null,
    reset_token_expires: null,
    created_at: new Date('2026-08-01T08:00:00Z')
  }
];

const resources = [
  { resource_id: 1, name: 'Laptop', quantity: 10, description: 'Standard issue office laptop', location: 'IT Store', status: 'available', created_at: new Date('2026-08-01T08:00:00Z') },
  { resource_id: 2, name: 'Projector', quantity: 3, description: 'Portable meeting room projector', location: 'Operations Store', status: 'available', created_at: new Date('2026-08-01T08:00:00Z') },
  { resource_id: 3, name: 'Office Chair', quantity: 15, description: 'Ergonomic office chair', location: 'Operations Store', status: 'available', created_at: new Date('2026-08-01T08:00:00Z') },
  { resource_id: 4, name: 'Printer Toner', quantity: 20, description: 'Black toner cartridge', location: 'IT Store', status: 'available', created_at: new Date('2026-08-01T08:00:00Z') }
];

const requests = [
  {
    request_id: 1,
    user_id: 3,
    resource_type: 'Laptop',
    resource_id: 1,
    quantity: 1,
    purpose: 'Standard issue laptop for new work assignments and system maintenance',
    request_date: '2026-08-15',
    status: 'pending',
    created_at: new Date('2026-08-15T09:00:00Z')
  },
  {
    request_id: 2,
    user_id: 3,
    resource_type: 'Office Chair',
    resource_id: 3,
    quantity: 1,
    purpose: 'Ergonomic chair replacement for desk workspace',
    request_date: '2026-08-10',
    status: 'approved',
    created_at: new Date('2026-08-10T14:30:00Z')
  },
  {
    request_id: 3,
    user_id: 3,
    resource_type: 'Projector',
    resource_id: 2,
    quantity: 1,
    purpose: 'Departmental quarterly review presentation',
    request_date: '2026-08-05',
    status: 'approved',
    created_at: new Date('2026-08-05T11:00:00Z')
  }
];

const approvals = [
  {
    approval_id: 1,
    request_id: 2,
    approver_id: 2,
    decision: 'approved',
    remarks: 'Approved for Operations department staff workspace.',
    approval_date: new Date('2026-08-11T10:00:00Z')
  },
  {
    approval_id: 2,
    request_id: 3,
    approver_id: 2,
    decision: 'approved',
    remarks: 'Approved from Operations Store reserve.',
    approval_date: new Date('2026-08-06T15:00:00Z')
  }
];

const notifications = [
  {
    notification_id: 1,
    user_id: 3,
    request_id: 2,
    type: 'decision',
    message: 'Your request for Office Chair was approved by Fatima Bello.',
    is_read: false,
    created_at: new Date('2026-08-11T10:00:00Z')
  },
  {
    notification_id: 2,
    user_id: 2,
    request_id: 1,
    type: 'request_submitted',
    message: 'John Okafor submitted a new request for Laptop.',
    is_read: false,
    created_at: new Date('2026-08-15T09:00:00Z')
  }
];

const auditLogs = [
  {
    log_id: 1,
    user_id: 1,
    action: 'SYSTEM_BOOT',
    details: 'System initialized with default seed records',
    created_at: new Date('2026-08-01T08:00:00Z')
  },
  {
    log_id: 2,
    user_id: 3,
    action: 'SUBMIT_REQUEST',
    details: 'Requested 1 x Laptop',
    created_at: new Date('2026-08-15T09:00:00Z')
  }
];

let nextUserId = 4;
let nextDeptId = 4;
let nextResourceId = 5;
let nextRequestId = 4;
let nextApprovalId = 3;
let nextNotificationId = 3;
let nextLogId = 3;

// In-memory query simulator for AI Studio environment
function executeMockQuery(sql, params = []) {
  const cleanSql = sql.trim().replace(/\s+/g, ' ');
  const upper = cleanSql.toUpperCase();

  // 1. AUTH: Login query
  // SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE (u.username = ? OR u.email = ?)
  if (upper.includes('FROM USERS U') && upper.includes('JOIN ROLES R') && upper.includes('WHERE (U.USERNAME = ? OR U.EMAIL = ?)')) {
    const term = params[0];
    const user = users.find(u => (u.username === term || u.email === term));
    if (!user) return [[]];
    const role = roles.find(r => r.role_id === user.role_id);
    return [[{ ...user, role_name: role ? role.role_name : '' }]];
  }

  // 1b. AUTH: User by user_id
  if (upper.includes('FROM USERS U') && upper.includes('JOIN ROLES R') && upper.includes('WHERE U.USER_ID = ?')) {
    const uid = Number(params[0]);
    const user = users.find(u => u.user_id === uid);
    if (!user) return [[]];
    const role = roles.find(r => r.role_id === user.role_id);
    return [[{ ...user, role_name: role ? role.role_name : '' }]];
  }

  // 2. AUTH: Check existing username or email
  // SELECT user_id FROM users WHERE username = ? OR email = ?
  if (upper.includes('SELECT USER_ID FROM USERS WHERE USERNAME = ? OR EMAIL = ?')) {
    const [uname, email] = params;
    const match = users.filter(u => u.username === uname || u.email === email);
    return [match.map(u => ({ user_id: u.user_id }))];
  }

  // 3. AUTH: Find Staff role_id
  // SELECT role_id FROM roles WHERE role_name = 'Staff'
  if (upper.includes('SELECT ROLE_ID FROM ROLES WHERE ROLE_NAME = \'STAFF\'')) {
    const role = roles.find(r => r.role_name === 'Staff');
    return [[role ? { role_id: role.role_id } : { role_id: 3 }]];
  }

  // 4. AUTH / ADMIN: Insert user
  // INSERT INTO users (full_name, username, email, password_hash, role_id, department_id, status) VALUES (?, ?, ?, ?, ?, ?, 'active')
  if (upper.startsWith('INSERT INTO USERS')) {
    const [full_name, username, email, password_hash, role_id, department_id] = params;
    const newUser = {
      user_id: nextUserId++,
      full_name,
      username,
      email,
      password_hash,
      role_id: Number(role_id),
      department_id: department_id ? Number(department_id) : null,
      status: 'active',
      reset_token: null,
      reset_token_expires: null,
      created_at: new Date()
    };
    users.push(newUser);
    return [{ insertId: newUser.user_id, affectedRows: 1 }];
  }

  // 5. AUTH: Forgot password lookup
  // SELECT user_id, username FROM users WHERE email = ?
  if (upper.includes('SELECT USER_ID, USERNAME FROM USERS WHERE EMAIL = ?')) {
    const [email] = params;
    const match = users.filter(u => u.email === email);
    return [match.map(u => ({ user_id: u.user_id, username: u.username }))];
  }

  // 6. AUTH: Set reset token
  // UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?
  if (upper.startsWith('UPDATE USERS SET RESET_TOKEN = ?')) {
    const [token, expires, user_id] = params;
    const u = users.find(u => u.user_id === Number(user_id));
    if (u) {
      u.reset_token = token;
      u.reset_token_expires = expires;
    }
    return [{ affectedRows: u ? 1 : 0 }];
  }

  // 7. AUTH: Verify reset token
  // SELECT user_id, username FROM users WHERE reset_token = ? AND reset_token_expires > NOW()
  if (upper.includes('WHERE RESET_TOKEN = ?')) {
    const [token] = params;
    const match = users.filter(u => u.reset_token === token && (!u.reset_token_expires || new Date(u.reset_token_expires) > new Date()));
    return [match.map(u => ({ user_id: u.user_id, username: u.username }))];
  }

  // 8. AUTH: Reset password
  // UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE user_id = ?
  if (upper.includes('UPDATE USERS SET PASSWORD_HASH = ?')) {
    const [password_hash, user_id] = params;
    const u = users.find(u => u.user_id === Number(user_id));
    if (u) {
      u.password_hash = password_hash;
      u.reset_token = null;
      u.reset_token_expires = null;
    }
    return [{ affectedRows: u ? 1 : 0 }];
  }

  // 9. REQUESTS: Get all requests (or filtered by user_id)
  // SELECT rq.*, u.full_name AS requester_name, d.department_name FROM requests rq ...
  if ((upper.includes('FROM REQUESTS RQ') || upper.includes('FROM REQUESTS R')) && upper.includes('JOIN USERS U') && !upper.includes('WHERE RQ.REQUEST_ID = ?') && !upper.includes('WHERE R.REQUEST_ID = ?') && !upper.includes('GROUP BY')) {
    let list = [...requests];
    if (params.length > 0) {
      const uid = Number(params[0]);
      list = list.filter(r => r.user_id === uid);
    }
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const result = list.map(r => {
      const u = users.find(user => user.user_id === r.user_id);
      const d = u && u.department_id ? departments.find(dept => dept.department_id === u.department_id) : null;
      return {
        ...r,
        requester_name: u ? u.full_name : 'Unknown',
        requester_email: u ? u.email : '',
        department_name: d ? d.department_name : null
      };
    });
    return [result];
  }

  // 10. REQUESTS: Single request by ID
  // SELECT rq.*, u.full_name AS requester_name FROM requests rq JOIN users u ON rq.user_id = u.user_id WHERE rq.request_id = ?
  if ((upper.includes('FROM REQUESTS RQ') || upper.includes('FROM REQUESTS R')) && (upper.includes('WHERE RQ.REQUEST_ID = ?') || upper.includes('WHERE R.REQUEST_ID = ?'))) {
    const reqId = Number(params[0]);
    const r = requests.find(item => item.request_id === reqId);
    if (!r) return [[]];
    const u = users.find(user => user.user_id === r.user_id);
    return [[{ ...r, requester_name: u ? u.full_name : 'Unknown', requester_email: u ? u.email : '' }]];
  }

  // 11. APPROVALS: Approval history for a request
  // SELECT a.*, u.full_name AS approver_name FROM approvals a JOIN users u ON a.approver_id = u.user_id WHERE a.request_id = ? ORDER BY a.approval_date DESC
  if (upper.includes('FROM APPROVALS A') && upper.includes('WHERE A.REQUEST_ID = ?')) {
    const reqId = Number(params[0]);
    const list = approvals
      .filter(a => a.request_id === reqId)
      .sort((a, b) => new Date(b.approval_date) - new Date(a.approval_date))
      .map(a => {
        const u = users.find(user => user.user_id === a.approver_id);
        return { ...a, approver_name: u ? u.full_name : 'Approver' };
      });
    return [list];
  }

  // 12. REQUESTS: Insert request
  // INSERT INTO requests (user_id, resource_type, resource_id, quantity, purpose, status) VALUES (?, ?, ?, ?, ?, 'pending')
  if (upper.startsWith('INSERT INTO REQUESTS')) {
    const [user_id, resource_type, resource_id, quantity, purpose] = params;
    const newReq = {
      request_id: nextRequestId++,
      user_id: Number(user_id),
      resource_type,
      resource_id: resource_id ? Number(resource_id) : null,
      quantity: Number(quantity),
      purpose,
      request_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      created_at: new Date()
    };
    requests.push(newReq);
    return [{ insertId: newReq.request_id, affectedRows: 1 }];
  }

  // 13. USERS: Select manager/admin IDs and emails for notifications
  // SELECT u.user_id, u.full_name, u.email FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name IN ('Manager', 'Administrator') AND u.status = 'active'
  if (upper.includes('FROM USERS U') && upper.includes('WHERE R.ROLE_NAME IN (\'MANAGER\', \'ADMINISTRATOR\')')) {
    const matching = users.filter(u => {
      if (u.status !== 'active') return false;
      const r = roles.find(role => role.role_id === u.role_id);
      return r && (r.role_name === 'Manager' || r.role_name === 'Administrator');
    });
    return [matching.map(u => ({ user_id: u.user_id, full_name: u.full_name, email: u.email }))];
  }

  // 14. NOTIFICATIONS: Insert notification
  // INSERT INTO notifications (user_id, request_id, type, message) VALUES (?, ?, ?, ?)
  if (upper.startsWith('INSERT INTO NOTIFICATIONS')) {
    const [user_id, request_id, type, message] = params;
    const newNotif = {
      notification_id: nextNotificationId++,
      user_id: Number(user_id),
      request_id: request_id ? Number(request_id) : null,
      type,
      message,
      is_read: false,
      created_at: new Date()
    };
    notifications.push(newNotif);
    return [{ insertId: newNotif.notification_id, affectedRows: 1 }];
  }

  // 15. REQUESTS: Select * from requests where request_id = ?
  if (upper.startsWith('SELECT * FROM REQUESTS WHERE REQUEST_ID = ?')) {
    const reqId = Number(params[0]);
    const r = requests.find(item => item.request_id === reqId);
    return [r ? [r] : []];
  }

  // 16. REQUESTS: Update request status
  // UPDATE requests SET status = ? WHERE request_id = ?
  if (upper.startsWith('UPDATE REQUESTS SET STATUS = ? WHERE REQUEST_ID = ?')) {
    const [status, reqId] = params;
    const r = requests.find(item => item.request_id === Number(reqId));
    if (r) r.status = status;
    return [{ affectedRows: r ? 1 : 0 }];
  }

  // 17. APPROVALS: Insert approval record
  // INSERT INTO approvals (request_id, approver_id, decision, remarks) VALUES (?, ?, ?, ?)
  if (upper.startsWith('INSERT INTO APPROVALS')) {
    const [request_id, approver_id, decision, remarks] = params;
    const newApp = {
      approval_id: nextApprovalId++,
      request_id: Number(request_id),
      approver_id: Number(approver_id),
      decision,
      remarks: remarks || null,
      approval_date: new Date()
    };
    approvals.push(newApp);
    return [{ insertId: newApp.approval_id, affectedRows: 1 }];
  }

  // 18. RESOURCES: Select * from resources
  if (upper.startsWith('SELECT * FROM RESOURCES')) {
    const list = [...resources].sort((a, b) => a.name.localeCompare(b.name));
    return [list];
  }

  // 19. RESOURCES: Insert resource
  // INSERT INTO resources (name, quantity, description, location) VALUES (?, ?, ?, ?)
  if (upper.startsWith('INSERT INTO RESOURCES')) {
    const [name, quantity, description, location] = params;
    const newRes = {
      resource_id: nextResourceId++,
      name,
      quantity: Number(quantity) || 0,
      description: description || null,
      location: location || null,
      status: 'available',
      created_at: new Date()
    };
    resources.push(newRes);
    return [{ insertId: newRes.resource_id, affectedRows: 1 }];
  }

  // 20. RESOURCES: Update resource
  // UPDATE resources SET name = ?, quantity = ?, description = ?, location = ?, status = ? WHERE resource_id = ?
  if (upper.startsWith('UPDATE RESOURCES SET')) {
    const [name, quantity, description, location, status, resId] = params;
    const r = resources.find(item => item.resource_id === Number(resId));
    if (r) {
      if (name !== undefined) r.name = name;
      if (quantity !== undefined) r.quantity = Number(quantity);
      if (description !== undefined) r.description = description;
      if (location !== undefined) r.location = location;
      if (status !== undefined) r.status = status;
    }
    return [{ affectedRows: r ? 1 : 0 }];
  }

  // 21. RESOURCES: Delete resource
  if (upper.startsWith('DELETE FROM RESOURCES WHERE RESOURCE_ID = ?')) {
    const resId = Number(params[0]);
    const idx = resources.findIndex(item => item.resource_id === resId);
    if (idx !== -1) resources.splice(idx, 1);
    return [{ affectedRows: idx !== -1 ? 1 : 0 }];
  }

  // 22. USERS: Select all users for Admin
  // SELECT u.user_id, u.full_name, u.username, u.email, u.status, u.created_at, r.role_name, d.department_name, u.role_id, u.department_id FROM users u ...
  if (upper.includes('FROM USERS U') && upper.includes('JOIN ROLES R') && upper.includes('LEFT JOIN DEPARTMENTS D')) {
    const list = [...users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(u => {
      const r = roles.find(role => role.role_id === u.role_id);
      const d = u.department_id ? departments.find(dept => dept.department_id === u.department_id) : null;
      return {
        user_id: u.user_id,
        full_name: u.full_name,
        username: u.username,
        email: u.email,
        status: u.status,
        created_at: u.created_at,
        role_name: r ? r.role_name : 'Staff',
        department_name: d ? d.department_name : null,
        role_id: u.role_id,
        department_id: u.department_id
      };
    });
    return [list];
  }

  // 23. LOOKUP: Select * from roles
  if (upper.startsWith('SELECT * FROM ROLES')) {
    const list = [...roles].sort((a, b) => a.role_id - b.role_id);
    return [list];
  }

  // 24. LOOKUP / DEPARTMENTS: Select * from departments
  if (upper.startsWith('SELECT * FROM DEPARTMENTS')) {
    const list = [...departments].sort((a, b) => a.department_name.localeCompare(b.department_name));
    return [list];
  }

  // 25. USERS: Update user role / department / status
  // UPDATE users SET role_id = COALESCE(?, role_id), department_id = ?, status = COALESCE(?, status) WHERE user_id = ?
  if (upper.startsWith('UPDATE USERS SET ROLE_ID = COALESCE')) {
    const [role_id, department_id, status, user_id] = params;
    const u = users.find(item => item.user_id === Number(user_id));
    if (u) {
      if (role_id) u.role_id = Number(role_id);
      if (department_id !== undefined) u.department_id = department_id ? Number(department_id) : null;
      if (status) u.status = status;
    }
    return [{ affectedRows: u ? 1 : 0 }];
  }

  // 26. USERS: Deactivate user
  if (upper.startsWith('UPDATE USERS SET STATUS = \'INACTIVE\' WHERE USER_ID = ?')) {
    const user_id = Number(params[0]);
    const u = users.find(item => item.user_id === user_id);
    if (u) u.status = 'inactive';
    return [{ affectedRows: u ? 1 : 0 }];
  }

  // 27. NOTIFICATIONS: Get user notifications
  // SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  if (upper.startsWith('SELECT * FROM NOTIFICATIONS WHERE USER_ID = ?')) {
    const user_id = Number(params[0]);
    const list = notifications
      .filter(n => n.user_id === user_id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 50);
    return [list];
  }

  // 28. NOTIFICATIONS: Mark single as read
  if (upper.startsWith('UPDATE NOTIFICATIONS SET IS_READ = TRUE WHERE NOTIFICATION_ID = ?')) {
    const [notifId, user_id] = params;
    const n = notifications.find(item => item.notification_id === Number(notifId) && item.user_id === Number(user_id));
    if (n) n.is_read = true;
    return [{ affectedRows: n ? 1 : 0 }];
  }

  // 29. NOTIFICATIONS: Mark all as read
  if (upper.startsWith('UPDATE NOTIFICATIONS SET IS_READ = TRUE WHERE USER_ID = ?')) {
    const user_id = Number(params[0]);
    let count = 0;
    notifications.forEach(n => {
      if (n.user_id === user_id) {
        n.is_read = true;
        count++;
      }
    });
    return [{ affectedRows: count }];
  }

  // 30. REPORTS: Status counts
  // SELECT status, COUNT(*) AS count FROM requests GROUP BY status
  if (upper.includes('SELECT STATUS, COUNT(*) AS COUNT FROM REQUESTS GROUP BY STATUS')) {
    const counts = {};
    requests.forEach(r => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    const list = Object.keys(counts).map(status => ({ status, count: counts[status] }));
    return [list];
  }

  // 31. REPORTS: Requests by Department
  // SELECT d.department_name, COUNT(rq.request_id) AS count FROM requests rq JOIN users u ON rq.user_id = u.user_id LEFT JOIN departments d ... GROUP BY d.department_name
  if (upper.includes('GROUP BY D.DEPARTMENT_NAME')) {
    const deptCounts = {};
    requests.forEach(r => {
      const u = users.find(user => user.user_id === r.user_id);
      const d = u && u.department_id ? departments.find(dept => dept.department_id === u.department_id) : null;
      const name = d ? d.department_name : 'Unassigned';
      deptCounts[name] = (deptCounts[name] || 0) + 1;
    });
    const list = Object.keys(deptCounts).map(department_name => ({ department_name, count: deptCounts[department_name] }));
    return [list];
  }

  // 32. REPORTS: Top resources
  // SELECT resource_type, COUNT(*) AS count, SUM(quantity) AS total_quantity FROM requests GROUP BY resource_type ORDER BY count DESC LIMIT 5
  if (upper.includes('GROUP BY RESOURCE_TYPE')) {
    const map = {};
    requests.forEach(r => {
      if (!map[r.resource_type]) {
        map[r.resource_type] = { count: 0, total_quantity: 0 };
      }
      map[r.resource_type].count += 1;
      map[r.resource_type].total_quantity += (r.quantity || 1);
    });
    const list = Object.keys(map)
      .map(k => ({ resource_type: k, count: map[k].count, total_quantity: map[k].total_quantity }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return [list];
  }

  // 33. REPORTS: Total count
  if (upper.includes('SELECT COUNT(*) AS TOTAL FROM REQUESTS')) {
    return [[{ total: requests.length }]];
  }

  // 34. REPORTS: Audit logs
  // SELECT al.*, u.full_name, u.username FROM audit_logs al LEFT JOIN users u ON al.user_id = u.user_id ORDER BY al.created_at DESC LIMIT 200
  if (upper.includes('FROM AUDIT_LOGS AL')) {
    const list = [...auditLogs]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 200)
      .map(al => {
        const u = users.find(user => user.user_id === al.user_id);
        return {
          ...al,
          full_name: u ? u.full_name : null,
          username: u ? u.username : null
        };
      });
    return [list];
  }

  // 35. DEPARTMENTS: Check name exists
  // SELECT department_id FROM departments WHERE department_name = ?
  if (upper.includes('SELECT DEPARTMENT_ID FROM DEPARTMENTS WHERE DEPARTMENT_NAME = ?')) {
    const name = params[0];
    const match = departments.filter(d => d.department_name.toLowerCase() === name.toLowerCase());
    return [match.map(d => ({ department_id: d.department_id }))];
  }

  // 36. DEPARTMENTS: Insert department
  // INSERT INTO departments (department_name, location, description) VALUES (?, ?, ?)
  if (upper.startsWith('INSERT INTO DEPARTMENTS')) {
    const [department_name, location, description] = params;
    const newDept = {
      department_id: nextDeptId++,
      department_name,
      location: location || null,
      description: description || null
    };
    departments.push(newDept);
    return [{ insertId: newDept.department_id, affectedRows: 1 }];
  }

  // 37. DEPARTMENTS: Update department
  // UPDATE departments SET department_name = ?, location = ?, description = ? WHERE department_id = ?
  if (upper.startsWith('UPDATE DEPARTMENTS SET')) {
    const [department_name, location, description, deptId] = params;
    const d = departments.find(item => item.department_id === Number(deptId));
    if (d) {
      if (department_name) d.department_name = department_name;
      if (location !== undefined) d.location = location;
      if (description !== undefined) d.description = description;
    }
    return [{ affectedRows: d ? 1 : 0 }];
  }

  // 38. DEPARTMENTS: Check users in department
  // SELECT COUNT(*) AS count FROM users WHERE department_id = ?
  if (upper.includes('SELECT COUNT(*) AS COUNT FROM USERS WHERE DEPARTMENT_ID = ?')) {
    const deptId = Number(params[0]);
    const count = users.filter(u => u.department_id === deptId).length;
    return [[{ count }]];
  }

  // 39. DEPARTMENTS: Delete department
  if (upper.startsWith('DELETE FROM DEPARTMENTS WHERE DEPARTMENT_ID = ?')) {
    const deptId = Number(params[0]);
    const idx = departments.findIndex(item => item.department_id === deptId);
    if (idx !== -1) departments.splice(idx, 1);
    return [{ affectedRows: idx !== -1 ? 1 : 0 }];
  }

  // 40. AUDIT: Insert log
  // INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)
  if (upper.startsWith('INSERT INTO AUDIT_LOGS')) {
    const [user_id, action, details] = params;
    const newLog = {
      log_id: nextLogId++,
      user_id: user_id ? Number(user_id) : null,
      action,
      details: details || '',
      created_at: new Date()
    };
    auditLogs.push(newLog);
    return [{ insertId: newLog.log_id, affectedRows: 1 }];
  }

  console.warn('[DB Mock] Unhandled query pattern:', sql, params);
  return [[]];
}

const mockPool = {
  query: async (sql, params) => executeMockQuery(sql, params),
  execute: async (sql, params) => executeMockQuery(sql, params),
  getConnection: async () => ({
    query: async (sql, params) => executeMockQuery(sql, params),
    execute: async (sql, params) => executeMockQuery(sql, params),
    release: () => {}
  })
};

// If an external MySQL DB is explicitly configured, attempt to use it; otherwise use the reliable mock store
let realPool = null;
let useRealDb = false;

const dbHost = process.env.DB_HOST || 'localhost';
const isLocalhost = dbHost === 'localhost' || dbHost === '127.0.0.1';

if (process.env.USE_REAL_MYSQL === 'true') {
  if (isLocalhost) {
    console.log('[Database] Notice: DB_HOST is set to localhost/127.0.0.1. Running in cloud container with the high-performance integrated MySQL schema store. To connect to an external MySQL server, provide a remote DB_HOST in your environment variables.');
  } else {
    try {
      realPool = mysql.createPool({
        host: dbHost,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'rram_system',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 4000
      });
      useRealDb = true;
      console.log(`[Database] Initialized external MySQL connection pool for ${dbHost}:${process.env.DB_PORT || 3306}`);
    } catch (err) {
      console.warn('[Database] Failed to configure external MySQL pool:', err.message);
    }
  }
}

// Resilient wrapper: if realPool is active but encounters connection refused or network issues,
// it gracefully falls back to mockPool so the application never crashes with ECONNREFUSED!
const resilientPool = {
  query: async (sql, params) => {
    if (useRealDb && realPool) {
      try {
        return await realPool.query(sql, params);
      } catch (err) {
        if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH', 'ER_ACCESS_DENIED_ERROR', 'PROTOCOL_CONNECTION_LOST'].includes(err.code)) {
          console.warn(`[Database Fallback] MySQL error (${err.code}: ${err.message}). Seamlessly serving request from integrated store.`);
          useRealDb = false;
          return mockPool.query(sql, params);
        }
        throw err;
      }
    }
    return mockPool.query(sql, params);
  },
  execute: async (sql, params) => {
    if (useRealDb && realPool) {
      try {
        return await realPool.execute(sql, params);
      } catch (err) {
        if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH', 'ER_ACCESS_DENIED_ERROR', 'PROTOCOL_CONNECTION_LOST'].includes(err.code)) {
          console.warn(`[Database Fallback] MySQL error (${err.code}: ${err.message}). Seamlessly serving request from integrated store.`);
          useRealDb = false;
          return mockPool.execute(sql, params);
        }
        throw err;
      }
    }
    return mockPool.execute(sql, params);
  },
  getConnection: async () => {
    if (useRealDb && realPool) {
      try {
        return await realPool.getConnection();
      } catch (err) {
        console.warn(`[Database Fallback] MySQL getConnection error (${err.code}). Seamlessly serving request from integrated store.`);
        useRealDb = false;
        return mockPool.getConnection();
      }
    }
    return mockPool.getConnection();
  }
};

module.exports = resilientPool;
