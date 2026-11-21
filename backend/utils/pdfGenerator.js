const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Generate a complete, polished PDF manual for RRAM and stream to response
 * @param {import('express').Response} res
 */
function generateDocumentationPDF(res) {
  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
    bufferPages: true,
    info: {
      Title: 'RRAM System Documentation & Technical Specification',
      Author: 'RRAM Engineering Team',
      Subject: 'Resource Request & Approval Management System Specification',
      Keywords: 'RRAM, Requisitions, ERP, System Manual, Documentation'
    }
  });

  // Set response headers for direct PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="RRAM_System_Documentation.pdf"');

  doc.pipe(res);

  const primaryColor = '#0b2038';
  const accentColor = '#4f46e5';
  const textColor = '#1e293b';
  const mutedColor = '#64748b';
  const borderColor = '#cbd5e1';

  // Helper: Section Header
  function drawSectionHeader(number, title) {
    doc.addPage();
    doc.fillColor(accentColor).fontSize(10).font('Helvetica-Bold').text(`SECTION ${number}`, { characterSpacing: 1 });
    doc.moveDown(0.2);
    doc.fillColor(primaryColor).fontSize(18).font('Helvetica-Bold').text(title);
    doc.moveDown(0.4);
    doc.strokeColor(borderColor).lineWidth(1).moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
    doc.moveDown(0.8);
    doc.fillColor(textColor).fontSize(10).font('Helvetica');
  }

  // --- COVER PAGE ---
  // Background decorative accent bar
  doc.rect(0, 0, doc.page.width, 10).fill(primaryColor);

  // Logo insertion if available
  const logoPath = path.resolve(__dirname, '../../public/assets/aistudio/imgproject_9882702c.jpg');
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 40, 45, { width: 75 });
    } catch (e) {
      console.warn('Could not embed logo in PDF:', e.message);
    }
  }

  doc.y = 135;
  doc.fillColor(accentColor).fontSize(12).font('Helvetica-Bold').text('ENTERPRISE PLATFORM SPECIFICATION', { characterSpacing: 1.5 });
  doc.moveDown(0.3);
  doc.fillColor(primaryColor).fontSize(28).font('Helvetica-Bold').text('RRAM System Manual');
  doc.moveDown(0.2);
  doc.fillColor(mutedColor).fontSize(14).font('Helvetica').text('Resource Request & Approval Management');
  doc.moveDown(0.8);
  doc.strokeColor(borderColor).lineWidth(1.5).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
  doc.moveDown(1);

  // Metadata Card
  doc.rect(40, doc.y, doc.page.width - 80, 80).fillAndStroke('#f8fafc', borderColor);
  const metaY = doc.y + 12;
  doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold');
  doc.text('VERSION:', 55, metaY);
  doc.text('DATE GENERATED:', 180, metaY);
  doc.text('CLASSIFICATION:', 340, metaY);

  doc.fillColor(textColor).fontSize(9).font('Helvetica');
  doc.text('1.2.0 (Release Candidate)', 55, metaY + 14);
  doc.text(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), 180, metaY + 14);
  doc.text('Enterprise / Confidential', 340, metaY + 14);

  doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold');
  doc.text('CORE STACK:', 55, metaY + 36);
  doc.text('NOTIFICATION ENGINE:', 180, metaY + 36);
  doc.text('AUTH MODEL:', 340, metaY + 36);

  doc.fillColor(textColor).fontSize(9).font('Helvetica');
  doc.text('React 18 · Express · MySQL', 55, metaY + 50);
  doc.text('In-App & SMTP HTML Alerts', 180, metaY + 50);
  doc.text('JWT & Role-Based RBAC', 340, metaY + 50);

  doc.y = metaY + 85;
  doc.moveDown(1.5);

  // Table of Contents Overview on Cover Page
  doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('TABLE OF CONTENTS');
  doc.moveDown(0.6);

  const toc = [
    { num: '01', title: 'Executive Summary & Core Objectives' },
    { num: '02', title: 'System Architecture & Technology Stack' },
    { num: '03', title: 'Role-Based Access Control (RBAC) Matrix' },
    { num: '04', title: 'End-to-End Requisition Lifecycle' },
    { num: '05', title: 'Complete Database Schema & Data Dictionary' },
    { num: '06', title: 'REST API Specification & Routes' },
    { num: '07', title: 'Automated Email Notification System' },
    { num: '08', title: 'Configuration & Demonstration Credentials' }
  ];

  toc.forEach(item => {
    doc.fillColor(accentColor).fontSize(10).font('Helvetica-Bold').text(item.num, 45, doc.y, { continued: true });
    doc.fillColor(textColor).fontSize(10).font('Helvetica').text(`   ${item.title}`);
    doc.moveDown(0.4);
  });

  // --- SECTION 1 ---
  drawSectionHeader('01', '1. Executive Summary & Core Objectives');
  doc.fontSize(10).font('Helvetica').text(
    'The Resource Request and Approval Management (RRAM) platform is an enterprise-grade requisition ' +
    'system designed to eliminate unorganized paper memos, email threads, and manual spreadsheet trackers. ' +
    'It introduces complete visibility, operational velocity, and governance into how institutional resources ' +
    'are requisitioned, reviewed, approved, and accounted for.'
  );
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').fillColor(primaryColor).text('Primary Objectives:');
  doc.moveDown(0.4);
  const objList = [
    'Enforce Strict Governance: Ensure no capital or consumable asset is allocated without designated manager review.',
    'Eliminate Operational Bottlenecks: Real-time dual notification (in-app + automated email alerts) minimizes decision latency.',
    'Guarantee 100% Audit Readiness: Every user registration, request submission, status change, and approval remark is permanently logged in the audit trail.',
    'Fault-Tolerant Reliability: Adaptive database abstraction layer operates seamlessly in cloud-native containerized environments while fully supporting enterprise MySQL instances (AWS RDS, Google Cloud SQL, PlanetScale).'
  ];
  objList.forEach(obj => {
    doc.fillColor(accentColor).text('• ', { continued: true });
    doc.fillColor(textColor).font('Helvetica').text(obj);
    doc.moveDown(0.4);
  });

  // --- SECTION 2 ---
  drawSectionHeader('02', '2. System Architecture & Technology Stack');
  doc.text(
    'RRAM is structured as a decoupled modern web application with a high-performance Express REST backend ' +
    'and an interactive React Single Page Application (SPA).'
  );
  doc.moveDown(0.8);

  const archLayers = [
    { name: 'Frontend Client', tech: 'React 18 · Vite · Tailwind CSS', desc: 'Responsive user interface, dark mode theme engine, role-guarded route trees, interactive modals, and Lucide vector iconography.' },
    { name: 'Application Server', tech: 'Node.js · Express.js', desc: 'Centralized API gateway, token authentication middleware, parameter validation, rate-friendly CORS configuration, and asynchronous notification dispatch.' },
    { name: 'Persistence Layer', tech: 'MySQL 8.0+ / In-Memory Mock Store', desc: 'Relational database schema with full foreign-key constraints. Features a smart fallback wrapper that guarantees zero-crash uptime in sandbox containers.' },
    { name: 'Security & Auth', tech: 'bcryptjs · JSON Web Tokens (JWT)', desc: 'Salted cryptographic password hashing (10 salt rounds) and stateless cryptographically signed JWT tokens with expiration.' },
    { name: 'Notification Service', tech: 'Nodemailer (SMTP)', desc: 'Generates branded HTML email notifications with direct deep-links and maintains a persistent delivery event log.' }
  ];

  archLayers.forEach(l => {
    doc.rect(40, doc.y, doc.page.width - 80, 48).fillAndStroke('#f8fafc', borderColor);
    const boxY = doc.y - 48 + 8;
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text(l.name, 50, boxY);
    doc.fillColor(accentColor).font('Helvetica-Bold').fontSize(9).text(l.tech, 200, boxY);
    doc.fillColor(textColor).font('Helvetica').fontSize(8.5).text(l.desc, 50, boxY + 16, { width: doc.page.width - 100 });
    doc.y = boxY + 46;
  });

  // --- SECTION 3 ---
  drawSectionHeader('03', '3. Role-Based Access Control (RBAC) Matrix');
  doc.text('RRAM defines three distinct hierarchical personas to enforce segregation of duties:');
  doc.moveDown(0.8);

  const permissions = [
    { cap: 'Submit Resource Requisitions', staff: 'Yes', mgr: 'Yes', admin: 'Yes' },
    { cap: 'View Personal Submissions', staff: 'Yes', mgr: 'Yes', admin: 'Yes' },
    { cap: 'View Entire Organization Requisitions', staff: 'No', mgr: 'Yes', admin: 'Yes' },
    { cap: 'Approve or Reject Requisitions', staff: 'No', mgr: 'Yes', admin: 'Yes' },
    { cap: 'Request Requisition Modifications', staff: 'No', mgr: 'Yes', admin: 'Yes' },
    { cap: 'Executive Analytics & CSV/JSON Exports', staff: 'No', mgr: 'Yes', admin: 'Yes' },
    { cap: 'Catalogue Management (CRUD Resources)', staff: 'No', mgr: 'No', admin: 'Yes' },
    { cap: 'User Governance & Role Assignment', staff: 'No', mgr: 'No', admin: 'Yes' },
    { cap: 'Department Configuration', staff: 'No', mgr: 'No', admin: 'Yes' },
    { cap: 'Immutable System Audit Trail', staff: 'No', mgr: 'No', admin: 'Yes' }
  ];

  // Table header
  const tableY = doc.y;
  doc.rect(40, tableY, doc.page.width - 80, 20).fill(primaryColor);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
  doc.text('CAPABILITY / OPERATION', 50, tableY + 5);
  doc.text('STAFF', 290, tableY + 5);
  doc.text('MANAGER', 370, tableY + 5);
  doc.text('ADMINISTRATOR', 450, tableY + 5);
  doc.y = tableY + 20;

  permissions.forEach((p, idx) => {
    const rowY = doc.y;
    const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.rect(40, rowY, doc.page.width - 80, 18).fillAndStroke(bg, '#e2e8f0');
    doc.fillColor(textColor).font('Helvetica').fontSize(8.5).text(p.cap, 50, rowY + 4);
    
    doc.fillColor(p.staff === 'Yes' ? '#16a34a' : '#dc2626').font('Helvetica-Bold').text(p.staff, 290, rowY + 4);
    doc.fillColor(p.mgr === 'Yes' ? '#16a34a' : '#dc2626').font('Helvetica-Bold').text(p.mgr, 370, rowY + 4);
    doc.fillColor(p.admin === 'Yes' ? '#16a34a' : '#dc2626').font('Helvetica-Bold').text(p.admin, 450, rowY + 4);
    doc.y = rowY + 18;
  });

  // --- SECTION 4 ---
  drawSectionHeader('04', '4. End-to-End Requisition Lifecycle');
  doc.text('The lifecycle of every resource requisition proceeds through four monitored stages:');
  doc.moveDown(0.8);

  const steps = [
    {
      num: '1. Submission',
      detail: 'Staff selects a resource from the approved catalogue (or specifies a custom item), enters the quantity, and details the organizational purpose. A record is created in the database with status = pending, and an audit entry is logged.'
    },
    {
      num: '2. Broadcast & Alerting',
      detail: 'The notification engine creates in-app notifications for all active Managers and Administrators. Simultaneously, automated HTML notification emails are dispatched containing full requester identity, item specifications, and direct decision links.'
    },
    {
      num: '3. Managerial Review',
      detail: 'A manager or admin opens /approvals. They examine the justification and select one of three actions:\n• Approve: Status changes to approved; inventory or budget authorization proceeds.\n• Reject: Status changes to rejected with mandatory explanatory remarks.\n• Request Modification: Staff is directed to update specifications.'
    },
    {
      num: '4. Decision Notification & Closure',
      detail: 'The requester receives an immediate in-app inbox alert and a branded status email indicating the outcome, approver name, and remarks. The event is finalized in the audit trail.'
    }
  ];

  steps.forEach(s => {
    doc.fillColor(accentColor).font('Helvetica-Bold').fontSize(10).text(s.num);
    doc.moveDown(0.2);
    doc.fillColor(textColor).font('Helvetica').fontSize(9).text(s.detail, { lineGap: 2 });
    doc.moveDown(0.8);
  });

  // --- SECTION 5 ---
  drawSectionHeader('05', '5. Database Schema & Data Dictionary');
  doc.text('The RRAM relational database consists of 8 interconnected tables with enforced foreign-key constraints:');
  doc.moveDown(0.8);

  const tables = [
    { name: 'users', fields: 'user_id (PK), username, password_hash, email, full_name, role_id (FK), department_id (FK), status (active/inactive), reset_token, reset_expires' },
    { name: 'roles', fields: 'role_id (PK), role_name (Staff, Manager, Administrator), description' },
    { name: 'departments', fields: 'department_id (PK), department_name, description, created_at' },
    { name: 'resources', fields: 'resource_id (PK), name, category, description, available_quantity, unit, is_active' },
    { name: 'requests', fields: 'request_id (PK), user_id (FK), resource_type, resource_id (FK, nullable), quantity, purpose, status (pending/approved/rejected/modification_requested), request_date' },
    { name: 'approvals', fields: 'approval_id (PK), request_id (FK), approver_id (FK), decision, remarks, decision_date' },
    { name: 'notifications', fields: 'notification_id (PK), user_id (FK), request_id, type, message, is_read, created_at' },
    { name: 'audit_logs', fields: 'log_id (PK), user_id (FK), action, details, timestamp, ip_address' }
  ];

  tables.forEach(t => {
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9.5).text(`Table: ${t.name}`, { continued: true });
    doc.fillColor(mutedColor).font('Helvetica').fontSize(8.5).text(' — Relational Entity');
    doc.moveDown(0.2);
    doc.fillColor(textColor).font('Courier').fontSize(8).text(t.fields, { indent: 10 });
    doc.moveDown(0.5);
  });

  // --- SECTION 6 ---
  drawSectionHeader('06', '6. REST API Specification & Routes');
  doc.text('RRAM exposes a clean, authenticated JSON REST API:');
  doc.moveDown(0.8);

  const endpoints = [
    { m: 'POST', p: '/api/auth/login', a: 'Public', d: 'Authenticates username and password, returns signed JWT & profile' },
    { m: 'POST', p: '/api/auth/register', a: 'Public', d: 'Registers new staff account assigned to chosen department' },
    { m: 'POST', p: '/api/auth/forgot-password', a: 'Public', d: 'Generates reset token and dispatches automated recovery email' },
    { m: 'GET', p: '/api/requests', a: 'Auth', d: 'Lists requests (scoped to personal for Staff, global for Managers/Admins)' },
    { m: 'POST', p: '/api/requests', a: 'Staff+', d: 'Submits new requisition; triggers automated alerts and email dispatch' },
    { m: 'POST', p: '/api/requests/:id/decision', a: 'Manager+', d: 'Records approval or rejection decision and dispatches outcome email' },
    { m: 'GET', p: '/api/reports/summary', a: 'Manager+', d: 'Provides KPI totals, status breakdown, and top-requested items' },
    { m: 'GET', p: '/api/resources', a: 'Auth', d: 'Lists active catalogue resources for dropdown selections' },
    { m: 'POST', p: '/api/resources', a: 'Admin', d: 'Creates new inventory/catalogue resource item' },
    { m: 'GET', p: '/api/users', a: 'Admin', d: 'Returns complete user directory with role and department details' },
    { m: 'PATCH', p: '/api/users/:id/status', a: 'Admin', d: 'Activates or deactivates user accounts' },
    { m: 'GET', p: '/api/documentation/pdf', a: 'Public/Auth', d: 'Streams the complete system manual as a downloadable PDF binary' }
  ];

  const epY = doc.y;
  doc.rect(40, epY, doc.page.width - 80, 18).fill(primaryColor);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  doc.text('METHOD', 48, epY + 5);
  doc.text('ROUTE', 105, epY + 5);
  doc.text('AUTH', 260, epY + 5);
  doc.text('DESCRIPTION', 320, epY + 5);
  doc.y = epY + 18;

  endpoints.forEach((ep, idx) => {
    const rowY = doc.y;
    const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.rect(40, rowY, doc.page.width - 80, 16).fillAndStroke(bg, '#e2e8f0');
    doc.fillColor(accentColor).font('Helvetica-Bold').fontSize(7.5).text(ep.m, 48, rowY + 4);
    doc.fillColor(primaryColor).font('Courier').fontSize(7.5).text(ep.p, 105, rowY + 4);
    doc.fillColor(mutedColor).font('Helvetica-Bold').fontSize(7.5).text(ep.a, 260, rowY + 4);
    doc.fillColor(textColor).font('Helvetica').fontSize(7.5).text(ep.d, 320, rowY + 4);
    doc.y = rowY + 16;
  });

  // --- SECTION 7 & 8 ---
  drawSectionHeader('07', '7. Automated Email Engine & 8. Credentials');

  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(11).text('7. Email Notification Engine (SMTP)');
  doc.moveDown(0.3);
  doc.fillColor(textColor).font('Helvetica').fontSize(9).text(
    'RRAM integrates an enterprise SMTP notification engine utilizing nodemailer. Outbound emails ' +
    'feature responsive HTML styling, executive navy headers, distinct status badges (green for approved, ' +
    'red for rejected, amber for modifications), and direct call-to-action buttons.'
  );
  doc.moveDown(0.6);

  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(11).text('8. Default Demonstration Logins');
  doc.moveDown(0.3);
  doc.text('For rapid auditing, verification, and evaluation, three standard user profiles are pre-seeded:');
  doc.moveDown(0.5);

  const accounts = [
    { role: 'Administrator', user: 'admin', pass: 'Password123', scope: 'Full administration, user management, catalogue editor, audit trail.' },
    { role: 'Manager', user: 'manager', pass: 'Password123', scope: 'Requisition queue reviews, approve/reject decisions, analytical reports.' },
    { role: 'Staff Member', user: 'staff', pass: 'Password123', scope: 'New requisition submissions, personal request status tracking.' }
  ];

  accounts.forEach(a => {
    doc.rect(40, doc.y, doc.page.width - 80, 36).fillAndStroke('#f8fafc', borderColor);
    const aY = doc.y - 36 + 6;
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9).text(`${a.role} Profile`, 50, aY);
    doc.fillColor(accentColor).font('Courier-Bold').fontSize(8.5).text(`Username: ${a.user}  |  Password: ${a.pass}`, 180, aY);
    doc.fillColor(textColor).font('Helvetica').fontSize(8).text(a.scope, 50, aY + 14);
    doc.y = aY + 34;
  });

  // --- GLOBAL RUNNING FOOTERS ---
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    // Top header line on subsequent pages
    if (i > 0) {
      doc.fillColor(mutedColor).font('Helvetica').fontSize(7.5).text('RRAM System Manual · Technical Specification', 40, 20);
      doc.text('Confidential & Proprietary', doc.page.width - 150, 20, { align: 'right', width: 110 });
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(40, 30).lineTo(doc.page.width - 40, 30).stroke();
    }

    // Bottom footer line
    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(40, doc.page.height - 30).lineTo(doc.page.width - 40, doc.page.height - 30).stroke();
    doc.fillColor(mutedColor).font('Helvetica').fontSize(7.5).text(
      `Generated on ${new Date().toLocaleDateString()} — Page ${i + 1} of ${range.count}`,
      40,
      doc.page.height - 22,
      { align: 'center', width: doc.page.width - 80 }
    );
  }

  doc.end();
}

module.exports = {
  generateDocumentationPDF
};
