const crypto = require('crypto');
const db = require('./db');

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function signup(email, password, plan = 'free', ref = null) {
  if (!email || !password) throw new Error('Email e senha obrigatórios');
  if (password.length < 6) throw new Error('Senha precisa ter no mínimo 6 caracteres');

  const data = db.load();
  if (Object.values(data.users).some(u => u.email === email)) {
    throw new Error('Email já cadastrado');
  }

  const uid = db.genId();
  const apiKey = db.genApiKey(uid);
  const salt = crypto.randomBytes(16).toString('hex');

  data.users[uid] = {
    id: uid,
    email,
    password: hashPassword(password, salt),
    salt,
    plan,
    created: new Date().toISOString(),
    trialUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    referredBy: ref || null,
  };
  data.apikeys[apiKey] = { userId: uid, plan };

  // Referral bonus: +50 requests/mês para quem indicou
  if (ref && data.users[ref]) {
    data.users[ref].referralBonus = (data.users[ref].referralBonus || 0) + 50;
    console.log(`🎉 Referral: ${data.users[ref].email} indicou ${email} (+50 bonus)`);
    // Notificar admin via Telegram
    if (process.env.TELEGRAM_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const https = require('https');
      const msg = `🎉 Referral: ${data.users[ref].email} indicou ${email}! +50 requests de bonus`;
      const d = JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: msg });
      const r = https.request({ hostname: 'api.telegram.org', path: `/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } });
      r.write(d); r.end();
    }
  }

  db.save(data);

  return { user: { id: uid, email, plan }, api_key: apiKey };
}

function login(email, password) {
  const data = db.load();
  const user = Object.values(data.users).find(u => u.email === email);
  if (!user) throw new Error('Email não encontrado');

  if (user.salt) {
    if (user.password !== hashPassword(password, user.salt)) {
      throw new Error('Senha incorreta');
    }
  } else {
    if (user.password !== crypto.createHash('sha256').update(password).digest('hex')) {
      throw new Error('Senha incorreta');
    }
  }

  const ap = Object.entries(data.apikeys).find(([_, v]) => v.userId === user.id);
  return {
    user: { id: user.id, email: user.email, plan: user.plan, trialUntil: user.trialUntil },
    api_key: ap ? ap[0] : null,
  };
}

function authenticate(req) {
  const key = (req.headers['x-api-key'] || req.headers['authorization'] || '')
    .replace(/^Bearer\s+/i, '').trim();
  if (!key) return null;

  const data = db.load();
  const entry = data.apikeys[key];
  if (!entry) return null;

  const user = data.users[entry.userId];
  if (!user) return null;

  return {
    apiKey: key,
    userId: entry.userId,
    plan: user.plan || 'free',
    email: user.email,
    trialUntil: user.trialUntil,
  };
}

function upgradeUserPlan(userId, plan) {
  const data = db.load();
  if (!data.users[userId]) throw new Error('Usuário não encontrado');
  data.users[userId].plan = plan;
  Object.keys(data.apikeys).forEach(k => {
    if (data.apikeys[k].userId === userId) {
      data.apikeys[k].plan = plan;
    }
  });
  db.save(data);
}

module.exports = { signup, login, authenticate, hashPassword, upgradeUserPlan };