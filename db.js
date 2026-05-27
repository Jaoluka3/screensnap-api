const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'db.json');
const LOCK_PATH = path.join(DATA_DIR, 'db.lock');

const LIMITS = { free: 100, starter: 1500, pro: 5000 };
const OVERAGE_PRICE_CENTS = parseInt(process.env.OVERAGE_UNIT_PRICE_CENTS || '5');

function load() {
  try {
    const d = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    d.users = d.users || {};
    d.apikeys = d.apikeys || {};
    d.usage = d.usage || {};
    d.subscriptions = d.subscriptions || {};
    return d;
  } catch {
    return { users: {}, apikeys: {}, usage: {}, subscriptions: {} };
  }
}

function acquireLock() {
  let retries = 0;
  while (retries < 50) {
    try {
      fs.writeFileSync(LOCK_PATH, String(process.pid), { flag: 'wx' });
      return true;
    } catch {
      const start = Date.now();
      while (Date.now() - start < 10) {}
      retries++;
    }
  }
  return false;
}

function releaseLock() {
  try { fs.unlinkSync(LOCK_PATH); } catch {}
}

function save(d) {
  if (!acquireLock()) {
    const tmp = DB_PATH + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(d, null, 2));
    fs.renameSync(tmp, DB_PATH);
    return;
  }
  try {
    const tmp = DB_PATH + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(d, null, 2));
    fs.renameSync(tmp, DB_PATH);
  } finally {
    releaseLock();
  }
}

function getMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function trackUsage(uid, n = 1) {
  const db = load();
  const mk = getMonthKey();
  db.usage[uid] = db.usage[uid] || {};
  db.usage[uid][mk] = (db.usage[uid][mk] || 0) + n;
  save(db);
}

function getUserUsage(uid) {
  const db = load();
  return (db.usage[uid] && db.usage[uid][getMonthKey()]) || 0;
}

function genId() {
  return crypto.randomBytes(12).toString('hex');
}

function genApiKey(uid) {
  return `ss_${uid.substring(0, 8)}_${crypto.randomBytes(8).toString('hex')}`;
}

function getUserByApiKey(key) {
  const db = load();
  const entry = db.apikeys[key];
  if (!entry) return null;
  return db.users[entry.userId] || null;
}

module.exports = {
  DATA_DIR, DB_PATH, LIMITS, OVERAGE_PRICE_CENTS,
  load, save, getMonthKey,
  trackUsage, getUserUsage,
  genId, genApiKey, getUserByApiKey,
};