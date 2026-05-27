#!/usr/bin/env node
/**
 * Usage Alerts — notifica usuários próximos do limite via Telegram
 * Uso: node scripts/usage-alerts.js
 */
const path = require('path');
process.env.DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const db = require('../db');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function sendTelegram(msg) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
  const https = require('https');
  const data = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text: msg,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  });
  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
  });
  req.write(data);
  req.end();
}

function checkUsage() {
  const data = db.load();
  const users = Object.values(data.users);
  const alerts = [];

  users.forEach(u => {
    const usage = db.getUserUsage(u.id);
    const limit = db.LIMITS[u.plan] || 100;
    const pct = limit > 0 ? usage / limit : 1;

    if (pct >= 0.8 && pct < 1) {
      alerts.push({
        email: u.email,
        plan: u.plan,
        usage,
        limit,
        pct: Math.round(pct * 100),
      });
    }
  });

  if (alerts.length === 0) return;

  let msg = `⚠️ *Alerta de Uso — ${alerts.length} usuários perto do limite*\n\n`;
  alerts.forEach(a => {
    msg += `┣ ${a.email} (${a.plan.toUpperCase()}): ${a.usage}/${a.limit} — ${a.pct}%\n`;
  });
  msg += `\n🔗 Faça upgrade em: ${process.env.DOMAIN || 'https://seu-site.com'}/dashboard`;

  sendTelegram(msg);
  console.log(`✅ Alerta enviado: ${alerts.length} usuários`);
}

checkUsage();
