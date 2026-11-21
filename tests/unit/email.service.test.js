const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../../backend/config/db');
const {
  verifyConfig,
  getSafeConfig,
  sendNewRequestEmail,
  sendRequestDecisionEmail,
  getEmailLogs
} = require('../../backend/utils/email');

describe('Unit Tests — Email & Mailtrap Notification Service', () => {
  after(async () => {
    await pool.end();
  });
  it('getSafeConfig() masks sensitive credentials and exposes Mailtrap defaults', () => {
    const config = getSafeConfig();
    assert.equal(typeof config.host, 'string');
    assert.equal(typeof config.port, 'number');
    assert.equal('pass' in config, false, 'Raw password must never be exposed');
    assert.ok(config.maskedPassword === '' || config.maskedPassword.includes('•'));
  });

  it('verifyConfig() fails validation when host, user, or password is missing', async () => {
    const res = await verifyConfig({ host: 'sandbox.smtp.mailtrap.io', port: 2525, user: '', pass: '' });
    assert.equal(res.success, false);
    assert.match(res.error, /required/i);
  });

  it('sendNewRequestEmail() formats and records a new requisition alert', async () => {
    const beforeCount = getEmailLogs().length;
    const result = await sendNewRequestEmail({
      approverEmail: 'manager@miva.edu.ng',
      approverName: 'Marcus Vance',
      requesterName: 'Sarah Jenkins',
      requesterDepartment: 'Operations',
      resourceType: 'Unit Test Laptop',
      quantity: 2,
      purpose: 'Automated unit test check',
      requestId: 9001,
      appUrl: 'http://localhost:3000'
    });

    assert.equal(result.success, true);
    const logs = getEmailLogs();
    assert.equal(logs.length, beforeCount + 1);
    assert.equal(logs[0].eventType, 'request_submitted');
    assert.equal(logs[0].to, 'manager@miva.edu.ng');
    assert.match(logs[0].subject, /#9001.*Unit Test Laptop/);
  });

  it('sendRequestDecisionEmail() handles approved, rejected, and modification_requested states', async () => {
    const decisions = [
      { decision: 'approved', expectedEvent: 'request_approved', expectedWord: /APPROVED/ },
      { decision: 'rejected', expectedEvent: 'request_rejected', expectedWord: /REJECTED/ },
      { decision: 'modification_requested', expectedEvent: 'modification_requested', expectedWord: /MODIFICATION REQUESTED/ }
    ];

    for (const item of decisions) {
      const res = await sendRequestDecisionEmail({
        requesterEmail: 'staff@miva.edu.ng',
        requesterName: 'Sarah Jenkins',
        resourceType: 'Projector',
        quantity: 1,
        decision: item.decision,
        remarks: `Unit test remark for ${item.decision}`,
        approverName: 'System Administrator',
        requestId: 9002,
        appUrl: 'http://localhost:3000'
      });

      assert.equal(res.success, true);
      const latest = getEmailLogs()[0];
      assert.equal(latest.eventType, item.expectedEvent);
      assert.match(latest.subject, item.expectedWord);
    }
  });
});
