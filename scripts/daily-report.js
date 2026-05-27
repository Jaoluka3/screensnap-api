#!/usr/bin/env node
/**
 * Daily Report Script — envia resumo do faturamento via Telegram
 * Uso: node scripts/daily-report.js
 * Pode ser agendado via cron: 0 9 * * * node /app/scripts/daily-report.js
 */
const path = require('path');
process.env.DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const db = require('../db');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function sendTelegram(msg) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('❌ TELEGRAM_TOKEN ou TELEGRAM_CHAT_ID não configurados');
    console.log(msg);
    return;
  }
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

function generateReport() {
  const data = db.load();
  const users = Object.values(data.users);
  const subs = data.subscriptions || {};

  const plans = { free: 0, starter: 0, pro: 0 };
  const pricing = { starter: 49, pro: 149 };
  const annualPricing = { starter: 499, pro: 1499 };

  let totalMonthly = 0;
  let totalAnnual = 0;

  users.forEach(u => {
    plans[u.plan] = (plans[u.plan] || 0) + 1;
    const sub = subs[u.id];
    if (sub && sub.billing === 'annual') {
      totalAnnual += annualPricing[u.plan] || 0;
    } else if (u.plan !== 'free') {
      totalMonthly += pricing[u.plan] || 0;
    }
  });

  const mrr = totalMonthly + Math.round(totalAnnual / 12);
  const projectedDaily = Math.round(mrr / 30);

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  let msg = `📊 *ScreenSnap — Relatório Diário*\n📅 ${dateStr}\n\n`;
  msg += `👥 *Usuários*\n`;
  msg += `Total: ${users.length}\n`;
  msg += `┣ Free: ${plans.free}\n`;
  msg += `┣ Starter: ${plans.starter} (R$${plans.starter * 49}/mês)\n`;
  msg += `┗ Pro: ${plans.pro} (R$${plans.pro * 149}/mês)\n\n`;
  msg += `💰 *Faturamento*\n`;
  msg += `MRR: *R$${mrr}/mês*\n`;
  msg += `Projeção diária: *R$${projectedDaily}/dia*\n`;
  msg += `Meta R$100/dia: ${projectedDaily >= 100 ? '✅' : `❌ (faltam R$${100 - projectedDaily}/dia)`}\n\n`;

  const usageAlerts = users.filter(u => {
    const usage = db.getUserUsage(u.id);
    const limit = db.LIMITS[u.plan] || 100;
    return limit > 0 && usage / limit >= 0.8;
  });

  if (usageAlerts.length > 0) {
    msg += `⚠️ *Usuários próximos do limite (${usageAlerts.length})*\n`;
    usageAlerts.forEach(u => {
      const usage = db.getUserUsage(u.id);
      const limit = db.LIMITS[u.plan] || 100;
      msg += `┣ ${u.email}: ${usage}/${limit} (${Math.round((usage / limit) * 100)}%)\n`;
    });
  }

  return msg;
}

// Executar
const report = generateReport();
sendTelegram(report);
console.log('✅ Relatório enviado');
