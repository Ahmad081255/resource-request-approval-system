const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });

const pool = require('../../backend/config/db');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function apiRequest(method, endpoint, body = null, token = null) {
  const url = new URL(endpoint, BASE_URL);
  const payload = body ? JSON.stringify(body) : null;

  return new Promise((resolve, reject) => {
    const headers = {};
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, { method, headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks);
        let json = null;
        try {
          json = JSON.parse(raw.toString('utf8'));
        } catch {
          // Non-JSON responses (e.g. PDF or CSV)
        }
        resolve({ status: res.statusCode, headers: res.headers, raw, json });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

describe('Integration Tests — Combined API, Auth, TiDB Cloud & Notification Modules', () => {
  let staffToken = null;
  let adminToken = null;
  const createdRequestIds = [];

  before(async () => {
    // Verify API is reachable
    const health = await apiRequest('GET', '/api/health');
    assert.equal(health.status, 200, 'Server must be running on port 3000');
    assert.equal(health.json.status, 'ok');

    // Authenticate Staff and Admin accounts against live TiDB Cloud
    const staffLogin = await apiRequest('POST', '/api/auth/login', {
      username: 'staff',
      password: 'Password123'
    });
    assert.equal(staffLogin.status, 200);
    staffToken = staffLogin.json.token;

    const adminLogin = await apiRequest('POST', '/api/auth/login', {
      username: 'admin',
      password: 'Password123'
    });
    assert.equal(adminLogin.status, 200);
    adminToken = adminLogin.json.token;
  });

  after(async () => {
    // Clean up test records from TiDB Cloud so production/demo data stays clean
    for (const id of createdRequestIds) {
      await pool.query('DELETE FROM approvals WHERE request_id = ?', [id]);
      await pool.query('DELETE FROM notifications WHERE request_id = ?', [id]);
      await pool.query('DELETE FROM requests WHERE request_id = ?', [id]);
    }
    await pool.query("DELETE FROM audit_logs WHERE details LIKE '%[INT_TEST]%'");
    await pool.end();
  });

  it('rejects invalid credentials on login (401) and verifies valid session (/api/auth/me)', async () => {
    const badLogin = await apiRequest('POST', '/api/auth/login', {
      username: 'staff',
      password: 'WrongPassword!'
    });
    assert.equal(badLogin.status, 401);

    const me = await apiRequest('GET', '/api/auth/me', null, staffToken);
    assert.equal(me.status, 200);
    assert.equal(me.json.user.username, 'staff');
    assert.equal(me.json.user.role_name, 'Staff');
  });

  it('enforces RBAC: Staff cannot access Admin audit logs or approve requests (403)', async () => {
    const auditAttempt = await apiRequest('GET', '/api/reports/audit', null, staffToken);
    assert.equal(auditAttempt.status, 403);

    const decisionAttempt = await apiRequest('PATCH', '/api/requests/1/decision', {
      decision: 'approved'
    }, staffToken);
    assert.equal(decisionAttempt.status, 403);
  });

  it('completes end-to-end Requisition -> Approval -> Audit Trail -> Email Notification flow', async () => {
    // 1. Staff submits a request
    const submitRes = await apiRequest('POST', '/api/requests', {
      resource_type: 'Dell UltraSharp 27" Monitor',
      quantity: 2,
      purpose: '[INT_TEST] Automated integration test for approval workflow'
    }, staffToken);

    assert.equal(submitRes.status, 201);
    const requestId = submitRes.json.request_id;
    assert.ok(requestId > 0);
    createdRequestIds.push(requestId);

    // 2. Admin retrieves requests list and finds the new request
    const listRes = await apiRequest('GET', '/api/requests', null, adminToken);
    assert.equal(listRes.status, 200);
    const found = listRes.json.find((r) => r.request_id === requestId);
    assert.ok(found, 'Newly submitted request should appear in GET /api/requests');
    assert.equal(found.status, 'pending');

    // 3. Admin approves the request
    const approveRes = await apiRequest('PATCH', `/api/requests/${requestId}/decision`, {
      decision: 'approved',
      remarks: '[INT_TEST] Approved during integration testing'
    }, adminToken);
    assert.equal(approveRes.status, 200);

    // 4. Verify request status & approval history persisted in TiDB Cloud
    const detailRes = await apiRequest('GET', `/api/requests/${requestId}`, null, staffToken);
    assert.equal(detailRes.status, 200);
    assert.equal(detailRes.json.status, 'approved');
    assert.equal(detailRes.json.approvals.length, 1);
    assert.equal(detailRes.json.approvals[0].decision, 'approved');

    // 5. Verify notification was generated for Staff
    const notifRes = await apiRequest('GET', '/api/notifications', null, staffToken);
    assert.equal(notifRes.status, 200);
    assert.ok(notifRes.json.some((n) => n.request_id === requestId && n.type === 'decision'));

    // 6. Verify email outbox captured both submission & approval alerts (allow queued Mailtrap pacing)
    let emailFound = false;
    for (let i = 0; i < 45; i++) {
      const emailLogsRes = await apiRequest('GET', '/api/notifications/email-logs', null, adminToken);
      assert.equal(emailLogsRes.status, 200);
      if (emailLogsRes.json.some((e) => e.subject.includes(`#${requestId}`) && e.eventType === 'request_approved' && e.status === 'sent')) {
        emailFound = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    assert.ok(emailFound, 'Expected request_approved email to be delivered via queued outbox');
  });

  it('completes end-to-end Requisition -> Rejection flow with remarks', async () => {
    const submitRes = await apiRequest('POST', '/api/requests', {
      resource_type: 'Conference Room Projector',
      quantity: 5,
      purpose: '[INT_TEST] Automated integration test for rejection workflow'
    }, staffToken);

    assert.equal(submitRes.status, 201);
    const requestId = submitRes.json.request_id;
    createdRequestIds.push(requestId);

    const rejectRes = await apiRequest('PATCH', `/api/requests/${requestId}/decision`, {
      decision: 'rejected',
      remarks: '[INT_TEST] Exceeds available inventory'
    }, adminToken);
    assert.equal(rejectRes.status, 200);

    const detailRes = await apiRequest('GET', `/api/requests/${requestId}`, null, staffToken);
    assert.equal(detailRes.status, 200);
    assert.equal(detailRes.json.status, 'rejected');
    assert.equal(detailRes.json.approvals[0].remarks, '[INT_TEST] Exceeds available inventory');
  });

  it('verifies Reports, Audit Trail, CSV Export, and PDF Documentation endpoints', async () => {
    const summaryRes = await apiRequest('GET', '/api/reports/summary', null, adminToken);
    assert.equal(summaryRes.status, 200);
    assert.ok(typeof summaryRes.json.total === 'number');

    const auditRes = await apiRequest('GET', '/api/reports/audit', null, adminToken);
    assert.equal(auditRes.status, 200);
    assert.ok(Array.isArray(auditRes.json));

    const csvRes = await apiRequest('GET', '/api/reports/export/requests-csv', null, adminToken);
    assert.equal(csvRes.status, 200);
    assert.match(csvRes.headers['content-type'], /text\/csv/);

    const pdfRes = await apiRequest('GET', '/api/documentation/pdf');
    assert.equal(pdfRes.status, 200);
    assert.match(pdfRes.headers['content-type'], /application\/pdf/);
    assert.ok(pdfRes.raw.length > 5000, 'Generated PDF must be non-empty');
  });
});
