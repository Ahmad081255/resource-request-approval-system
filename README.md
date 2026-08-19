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
- **Role-Based Access Control** — Administrator, Manager, Staff, each with different navigation and permissions
- **Resource Request submission** — Staff pick from the resource catalogue or type a custom item, with quantity and justification
- **Approval workflow** — Managers/Administrators approve, reject, or request modifications, with optional remarks
- **Request tracking** — status shown as a stamp (Pending / Approved / Rejected / Needs Changes)
- **Notifications** — generated on submission and decision, with a "mark as read" inbox
- **User management** — Administrators create accounts, assign roles/departments, activate/deactivate users
- **Resource management** — Administrators maintain the resource catalogue (quantity, location, availability)
- **Reports** — request volume by status, by department, and top-requested resources
- **Audit trail** — every significant action (login, submit, decide, create/update/deactivate) is logged

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
