const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const TEST_DATA_DIR = path.join(__dirname, '..', 'data-test');
process.env.DATA_DIR = TEST_DATA_DIR;

const db = require('../db');
const auth = require('../auth');

function cleanTestData() {
  const fs = require('fs');
  try { fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true }); } catch {}
  fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
}

describe('Database', () => {
  before(() => cleanTestData());
  after(() => cleanTestData());

  it('should load empty db', () => {
    const d = db.load();
    assert.deepStrictEqual(d.users, {});
    assert.deepStrictEqual(d.apikeys, {});
    assert.deepStrictEqual(d.usage, {});
    assert.deepStrictEqual(d.subscriptions, {});
  });

  it('should save and load data', () => {
    const d = db.load();
    d.users['test'] = { id: 'test', email: 'test@test.com' };
    db.save(d);
    const d2 = db.load();
    assert.strictEqual(d2.users.test.email, 'test@test.com');
  });

  it('should generate unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) ids.add(db.genId());
    assert.strictEqual(ids.size, 100);
  });

  it('should generate API keys in correct format', () => {
    const uid = db.genId();
    const key = db.genApiKey(uid);
    assert.ok(key.startsWith('ss_'));
    assert.ok(key.includes(uid.substring(0, 8)));
  });

  it('should track usage per month', () => {
    const uid = 'test-usage';
    assert.strictEqual(db.getUserUsage(uid), 0);
    db.trackUsage(uid);
    assert.strictEqual(db.getUserUsage(uid), 1);
    db.trackUsage(uid, 5);
    assert.strictEqual(db.getUserUsage(uid), 6);
  });

  it('should have correct limits', () => {
    assert.strictEqual(db.LIMITS.free, 100);
    assert.strictEqual(db.LIMITS.starter, 1500);
    assert.strictEqual(db.LIMITS.pro, 5000);
    assert.strictEqual(db.OVERAGE_PRICE_CENTS, 5);
  });
});

describe('Auth', () => {
  before(() => cleanTestData());
  after(() => cleanTestData());

  it('should signup a user', () => {
    const result = auth.signup('user@test.com', '123456', 'free');
    assert.ok(result.user.id);
    assert.strictEqual(result.user.email, 'user@test.com');
    assert.strictEqual(result.user.plan, 'free');
    assert.ok(result.api_key.startsWith('ss_'));
  });

  it('should reject duplicate email', () => {
    assert.throws(() => auth.signup('user@test.com', '123456', 'free'), /Email já cadastrado/);
  });

  it('should login with correct credentials', () => {
    const result = auth.login('user@test.com', '123456');
    assert.strictEqual(result.user.email, 'user@test.com');
    assert.ok(result.api_key);
  });

  it('should reject wrong password', () => {
    assert.throws(() => auth.login('user@test.com', 'wrong'), /Senha incorreta/);
  });

  it('should reject non-existent email', () => {
    assert.throws(() => auth.login('noone@test.com', '123456'), /Email não encontrado/);
  });

  it('should reject short password', () => {
    assert.throws(() => auth.signup('short@test.com', '12345', 'free'), /mínimo 6 caracteres/i);
  });

  it('should authenticate with valid API key', () => {
    const result = auth.signup('apikey@test.com', '123456', 'starter');
    const req = { headers: { 'x-api-key': result.api_key } };
    const authResult = auth.authenticate(req);
    assert.ok(authResult);
    assert.strictEqual(authResult.plan, 'starter');
  });

  it('should reject invalid API key', () => {
    const req = { headers: { 'x-api-key': 'ss_invalid_key' } };
    assert.strictEqual(auth.authenticate(req), null);
  });

  it('should authenticate via Authorization header', () => {
    const result = auth.signup('bearer@test.com', '123456', 'pro');
    const req = { headers: { 'authorization': 'Bearer ' + result.api_key } };
    const authResult = auth.authenticate(req);
    assert.ok(authResult);
    assert.strictEqual(authResult.plan, 'pro');
  });

  it('should upgrade user plan', () => {
    const result = auth.signup('upgrade@test.com', '123456', 'free');
    auth.upgradeUserPlan(result.user.id, 'pro');
    const data = db.load();
    assert.strictEqual(data.users[result.user.id].plan, 'pro');
    const keyEntry = Object.entries(data.apikeys).find(([_, v]) => v.userId === result.user.id);
    assert.ok(keyEntry);
    assert.strictEqual(keyEntry[1].plan, 'pro');
  });
});

describe('HTTP Server', () => {
  const http = require('http');
  let server;
  let testApiKey;

  before(() => {
    cleanTestData();
    const app = require('../index');
    server = app.server;
  });

  after(() => {
    server.close();
    cleanTestData();
  });

  function request(method, path, opts = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path,
        method,
        headers: { ...opts.headers },
      };
      if (opts.body) {
        options.headers['Content-Type'] = 'application/json';
      }
      const req = http.request(options, res => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data ? JSON.parse(data) : null,
            });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, body: data });
          }
        });
      });
      req.on('error', reject);
      if (opts.body) req.write(JSON.stringify(opts.body));
      req.end();
    });
  }

  it('should return health check', async () => {
    const res = await request('GET', '/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.strictEqual(res.body.service, 'ScreenSnap API');
  });

  it('should signup via API', async () => {
    const res = await request('POST', '/api/auth', {
      body: { action: 'signup', email: 'api@test.com', password: '123456', plan: 'free' },
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.api_key);
    testApiKey = res.body.api_key;
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request('GET', '/nonexistent');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.error, 'Not found');
  });

  it('should reject missing API key', async () => {
    const res = await request('POST', '/v1/screenshot', {
      body: { url: 'https://example.com' },
    });
    assert.strictEqual(res.status, 401);
  });

  it('should reject invalid API key', async () => {
    const res = await request('POST', '/v1/screenshot', {
      headers: { 'x-api-key': 'ss_invalid' },
      body: { url: 'https://example.com' },
    });
    assert.strictEqual(res.status, 401);
  });
});
