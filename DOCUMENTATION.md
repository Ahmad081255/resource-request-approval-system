# RRAM — Resource Request & Approval Management System
## Comprehensive System Documentation & Technical Specification
**Version:** 1.2.0  
**Target Environment:** Node.js / Express / React / Vite / Tailwind CSS / MySQL  
**Classification:** Enterprise Resource Planning & Internal Requisitions  

---

## 1. Executive Summary & Overview

### 1.1 Purpose
The **Resource Request and Approval Management (RRAM)** system is an enterprise internal requisition platform designed to streamline, track, and audit organizational resource allocation. RRAM eliminates paper-based forms and unstructured email threads by enforcing structured multi-level workflows, role-based access control (RBAC), real-time notifications, automated email alerts, and an immutable audit trail.

### 1.2 Core Value Propositions
* **Multi-Role Governance**: Clear segregation of duties among Staff (requesters), Managers (first-line review & approval), and Administrators (system configuration & user governance).
* **Guaranteed Auditability**: Every submission, status change, review remark, user registration, and catalogue modification is logged in the `audit_logs` table.
* **Dual Notification Engine**: Instant in-app alerts complemented by automated branded HTML emails with direct review links.
* **High-Resilience Database Architecture**: Built with an adaptive connection layer that supports external MySQL instances (RDS, Cloud SQL, PlanetScale) while maintaining a high-performance in-memory fallback for containerized zero-downtime environments.
* **Executive Analytics**: Real-time KPI summary widgets, department requisition breakdowns, top-requested resource rankings, and multi-format reporting (CSV dataset, JSON payload, and printable PDF).

---

## 2. Technology Stack & Architectural Overview

### 2.1 Backend Architecture
* **Runtime**: Node.js (v18+)
* **Framework**: Express.js
* **Database Driver**: `mysql2/promise` with automatic resilient fallback
* **Authentication**: JSON Web Tokens (`jsonwebtoken`) with `bcryptjs` password hashing (salt rounds: 10)
* **Email Service**: `nodemailer` with standard SMTP configuration (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) and local activity logging fallback

### 2.2 Frontend Architecture
* **Framework**: React 18 SPA (Single Page Application)
* **Build System**: Vite (with dev server middleware integration)
* **Styling**: Tailwind CSS with dark mode support (`dark:` variant)
* **Icons**: `lucide-react`
* **Routing**: `react-router-dom` v6 with role-guarded route components
* **HTTP Client**: Native `fetch` with centralized API wrapper and bearer token interceptors

### 2.3 Directory Structure
```
├── backend/
│   ├── config/
│   │   └── db.js            # Resilient MySQL connection pool & in-memory mock engine
│   ├── middleware/
│   │   └── auth.js          # authenticate & authorize middleware functions
│   ├── routes/
│   │   ├── auth.js          # Authentication (login, register, forgot/reset password)
│   │   ├── requests.js      # Request creation, listing, approval & status updates
│   │   ├── resources.js     # Resource catalogue management (CRUD)
│   │   ├── users.js         # User administration, status updates & roles
│   │   ├── departments.js   # Department listing and management
│   │   ├── notifications.js # In-app notification inbox & test email endpoints
│   │   └── reports.js       # Analytical aggregations and executive metrics
│   └── utils/
│       ├── audit.js         # Audit log helper
│       └── email.js         # HTML email templates and SMTP dispatcher
├── frontend/
│   ├── public/              # Static assets (logo.jpg, favicon.svg)
│   └── src/
│       ├── api/client.js    # API helper with auth headers & error handling
│       ├── components/      # UI components (Layout, StatusBadge, etc.)
│       ├── context/         # AuthContext and ThemeContext
│       └── pages/           # Views (Dashboard, Requests, Approvals, Reports, Admin, Docs)
├── server.js                # Unified Express entry point with Vite middleware
├── .env.example             # Configuration template
└── metadata.json            # Application metadata
```

---

## 3. User Roles & Permission Matrix

| Feature / Action | Staff | Manager | Administrator |
| :--- | :---: | :---: | :---: |
| **Submit Resource Request** | Yes | Yes | Yes |
| **View Own Submitted Requests** | Yes | Yes | Yes |
| **View All Organization Requests** | No | Yes | Yes |
| **Approve / Reject Requests** | No | Yes | Yes |
| **Request Request Modifications** | No | Yes | Yes |
| **View Analytics & Reports** | No | Yes | Yes |
| **Export CSV & JSON Reports** | No | Yes | Yes |
| **Manage Resource Catalogue** | No | No | Yes |
| **Manage Users & Assign Roles** | No | No | Yes |
| **Activate / Deactivate Accounts** | No | No | Yes |
| **Manage Departments** | No | No | Yes |
| **View System Audit Trail** | No | No | Yes |
| **In-App Notification Inbox** | Yes | Yes | Yes |
| **Trigger Test Email Alerts** | Yes | Yes | Yes |

---

## 4. End-to-End Requisition Lifecycle

```
[Staff Member]
      │
      ▼
1. Submits Request (Resource, Quantity, Purpose)
      │
      ├───> 2. Database Record Created (`requests`, status = 'pending')
      ├───> 3. In-App Notification created for all Active Managers/Admins
      ├───> 4. Automated HTML Email dispatched to Approvers
      └───> 5. Activity logged in `audit_logs` ('SUBMIT_REQUEST')
      │
      ▼
[Manager / Administrator]
      │
      ▼
6. Accesses Approvals Queue (/approvals)
      │
      ├─── Option A: APPROVE
      │       ├── Status updated to 'approved'
      │       ├── Approval record written with remarks
      │       ├── In-app notification sent to Requester
      │       └── Automated HTML status email sent to Requester
      │
      ├─── Option B: REJECT
      │       ├── Status updated to 'rejected'
      │       ├── Rejection remarks recorded
      │       ├── In-app notification sent to Requester
      │       └── Automated HTML status email sent to Requester
      │
      └─── Option C: REQUEST MODIFICATION
              ├── Status updated to 'modification_requested'
              ├── Instructions recorded
              ├── In-app notification sent to Requester
              └── Automated HTML status email sent to Requester
```

---

## 5. Database Schema & Data Dictionary

### 5.1 Tables Summary
1. `roles` (role_id, role_name, description)
2. `departments` (department_id, department_name, description, created_at)
3. `users` (user_id, username, password_hash, email, full_name, role_id, department_id, status, reset_token, reset_expires, created_at, updated_at)
4. `resources` (resource_id, name, category, description, available_quantity, unit, is_active, created_at)
5. `requests` (request_id, user_id, resource_type, resource_id, quantity, purpose, status, request_date, updated_at)
6. `approvals` (approval_id, request_id, approver_id, decision, remarks, decision_date)
7. `notifications` (notification_id, user_id, request_id, type, message, is_read, created_at)
8. `audit_logs` (log_id, user_id, action, details, timestamp, ip_address)

### 5.2 Status Enums
* **User Status**: `'active'`, `'inactive'`
* **Request Status**: `'pending'`, `'approved'`, `'rejected'`, `'modification_requested'`
* **Approval Decision**: `'approved'`, `'rejected'`, `'modification_requested'`

---

## 6. REST API Reference

### 6.1 Authentication (`/api/auth`)
* `POST /api/auth/login`: Authenticates username/password, returns JWT token & user profile.
* `POST /api/auth/register`: Public registration endpoint creating new staff account.
* `GET /api/auth/me`: Retrieves current authenticated user profile using Bearer token.
* `POST /api/auth/forgot-password`: Generates secure password reset token and dispatches reset email.
* `POST /api/auth/reset-password`: Consumes token and sets new hashed password.

### 6.2 Requests (`/api/requests`)
* `GET /api/requests`: Retrieves requests. Staff receive only their requests; Managers/Admins receive all requests.
* `GET /api/requests/:id`: Retrieves specific request by ID with approval history.
* `POST /api/requests`: Submits a new resource requisition.
* `POST /api/requests/:id/decision`: Approves, rejects, or requests modifications (Manager/Admin only).

### 6.3 Resources (`/api/resources`)
* `GET /api/resources`: Lists all active resources for requisition forms.
* `POST /api/resources`: Adds resource to catalogue (Admin only).
* `PUT /api/resources/:id`: Updates resource details & quantity (Admin only).
* `DELETE /api/resources/:id`: Deactivates resource from catalogue (Admin only).

### 6.4 Analytics & Reports (`/api/reports`)
* `GET /api/reports/summary`: Returns aggregate metrics, status distributions, top requested resources, and department totals.

### 6.5 Notifications (`/api/notifications`)
* `GET /api/notifications`: Retrieves user's in-app notification list.
* `GET /api/notifications/email-logs`: Returns history of sent email notifications.
* `POST /api/notifications/test-email`: Dispatches an instant test notification email.
* `PATCH /api/notifications/:id/read`: Marks a notification as read.
* `PATCH /api/notifications/read-all`: Marks all notifications as read.

---

## 7. Configuration & Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | HTTP server port | `3000` |
| `JWT_SECRET` | Secret key for signing authentication tokens | Built-in fallback |
| `USE_REAL_MYSQL` | Set to `true` to connect to external MySQL | `false` |
| `DB_HOST` | Remote MySQL server hostname | `localhost` |
| `DB_PORT` | Remote MySQL server port | `3306` |
| `DB_USER` | MySQL database username | `root` |
| `DB_PASSWORD` | MySQL database user password | empty |
| `DB_NAME` | MySQL database name | `rram_system` |
| `SMTP_HOST` | SMTP server host for sending emails | empty |
| `SMTP_PORT` | SMTP port (typically 587 or 465) | `587` |
| `SMTP_SECURE` | Set to `true` for port 465 (TLS) | `false` |
| `SMTP_USER` | SMTP authentication username | empty |
| `SMTP_PASS` | SMTP authentication password | empty |
| `EMAIL_FROM` | Sender address in outbound emails | `"RRAM Notifications" <no-reply@rram-portal.com>` |

---

## 8. Default System Credentials

For rapid verification and auditing, the following pre-configured demonstration accounts are available:

* **Administrator**:
  * Username: `admin`
  * Password: `Password123`
  * Role: Full System Administration, User Management, Resource Catalogue, Audit Trail
* **Manager**:
  * Username: `manager`
  * Password: `Password123`
  * Role: Request Approvals Queue, Analytics, Decision Making
* **Staff Member**:
  * Username: `staff`
  * Password: `Password123`
  * Role: Requisition Submission, Status Tracking
