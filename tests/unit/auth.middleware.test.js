const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { authenticate, authorize } = require('../../backend/middleware/auth');

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
}

describe('Unit Tests — Authentication & RBAC Middleware', () => {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';

  it('rejects requests without an Authorization header (401)', () => {
    const req = { headers: {} };
    const res = createMockRes();
    let nextCalled = false;

    authenticate(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.match(res.body.error, /No token provided/i);
  });

  it('rejects requests with a malformed or invalid JWT (401)', () => {
    const req = { headers: { authorization: 'Bearer invalid.jwt.token' } };
    const res = createMockRes();
    let nextCalled = false;

    authenticate(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.match(res.body.error, /invalid/i);
  });

  it('attaches decoded user payload and calls next() for a valid JWT', () => {
    const payload = { user_id: 3, role_name: 'Staff', full_name: 'Sarah Jenkins' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockRes();
    let nextCalled = false;

    authenticate(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.user.user_id, 3);
    assert.equal(req.user.role_name, 'Staff');
  });

  it('blocks Staff role from accessing Administrator/Manager endpoints (403)', () => {
    const guard = authorize('Manager', 'Administrator');
    const req = { user: { user_id: 3, role_name: 'Staff' } };
    const res = createMockRes();
    let nextCalled = false;

    guard(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.error, /permission/i);
  });

  it('permits Manager and Administrator roles through authorize() guard', () => {
    const guard = authorize('Manager', 'Administrator');
    const req = { user: { user_id: 2, role_name: 'Manager' } };
    const res = createMockRes();
    let nextCalled = false;

    guard(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
  });
});
