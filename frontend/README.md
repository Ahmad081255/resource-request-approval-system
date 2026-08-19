# Resource Request and Approval Management System

A working prototype built from your project proposal: React frontend, Node.js/Express API,
MySQL database, with role-based access control (Administrator / Manager / Staff), a resource
request + approval workflow, notifications, reporting, and an audit trail.

## 1. Set up the database (MySQL Workbench)

1. Open MySQL Workbench and connect to your local MySQL server.
2. Open the file `backend/database/schema.sql` (File → Open SQL Script).
3. Run the whole script (the lightning bolt icon, or Ctrl+Shift+Enter). This will:
   - Create a database called `rram_system`
   - Create all tables (users, roles, departments, resources, requests, approvals, notifications, audit_logs)
   - Seed 3 roles, 3 departments, 4 sample resources, and 3 demo users

**Demo accounts (all use password `Password123`):**

| Username  | Role          |
|-----------|---------------|
| admin     | Administrator |
| manager   | Manager       |
| staff     | Staff         |

## 2. Run the backend API

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and set your MySQL credentials (the ones you use in Workbench):

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=rram_system
JWT_SECRET=any_long_random_string
PORT=5000
```

Then start the server:

```bash
npm start
```

You should see: `RRAM System API running on http://localhost:5000`

## 3. Run the frontend

In a **new terminal**:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Log in with any of the demo accounts above.

## What's included

- **Authentication** — JWT-based login, self-registration for Staff accounts, hashed passwords (bcrypt)
- **Forgot / reset password** — request a reset link from the login page, set a new password via a tokenized link (see note below on how this works in the demo)
- **Role-Based Access Control** — Administrator, Manager, Staff, each with different navigation and permissions
- **Department management** — Administrators create, edit, and delete departments; deletion is blocked while users are still assigned to protect data integrity
- **Registration by department** — new accounts choose their department from the live list of departments an administrator has added
- **Resource Request submission** — Staff pick from the resource catalogue or type a custom item, with quantity and justification
- **Approval workflow** — Managers/Administrators approve, reject, or request modifications, with optional remarks
- **Request tracking** — status shown as a stamp (Pending / Approved / Rejected / Needs Changes)
- **Notifications** — generated on submission and decision, with a "mark as read" inbox
- **User management** — Administrators create accounts, assign roles/departments, activate/deactivate users
- **Resource management** — Administrators maintain the resource catalogue (quantity, location, availability)
- **Reports** — request volume by status, by department, and top-requested resources
- **Audit trail** — every significant action (login, submit, decide, create/update/deactivate, password reset) is logged

### How "forgot password" works in this prototype

There's no email server wired up, so instead of emailing the reset link, the API returns it
directly and the "Forgot password" page displays it on screen with a clear "demo environment"
label. Clicking it takes you to the reset form. For a real deployment, swap the `resetLink` in
`backend/routes/auth.js` (`/forgot-password`) for an actual email send (e.g. Nodemailer or
SendGrid) and stop returning the token in the API response.

### If you already ran schema.sql before this update

Run `backend/database/migration_001_reset_password.sql` in MySQL Workbench to add the two new
columns (`reset_token`, `reset_token_expires`) to your existing `users` table without losing
your data. If you're setting up fresh, just run `schema.sql` — it already includes them.

## Project structure

```
backend/
  server.js              Express app entry point
  config/db.js            MySQL connection pool
  middleware/auth.js       JWT auth + RBAC middleware
  routes/                  auth, requests, resources, users, notifications, reports
  database/schema.sql      Full schema + seed data
frontend/
  src/pages/               Login, Register, Dashboard, Requests, Approvals, Reports, Admin/*
  src/components/          Layout (sidebar nav), Stamp (status badge)
  src/context/AuthContext  Login state, JWT storage
  src/api/client.js        Fetch wrapper that attaches the JWT
```

## Notes

- This is a prototype for demonstration/evaluation purposes, matching Chapter 3 of your
  proposal (functional requirements, ERD, architecture). Some non-functional items described
  in 3.8 (e.g. scheduled backups) are operational concerns for a live deployment rather than
  application code, and aren't implemented here.
- The frontend expects the API at `http://localhost:5000/api` by default — change
  `VITE_API_URL` in `frontend/.env` if you run the backend on a different port.
