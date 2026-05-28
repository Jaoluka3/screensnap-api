#!/usr/bin/env node
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const https = require('https');

const msg = process.argv.slice(2).join(' ');
if (!msg) { console.log('Uso: node notify.js "mensagem"'); process.exit(1); }
if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
  console.log('❌ Configure TELEGRAM_TOKEN e TELEGRAM_CHAT_ID no .env');
  process.exit(1);
}

const useMarkdown = !msg.includes('--') && !msg.includes('```');
const data = JSON.stringify({
  chat_id: TELEGRAM_CHAT_ID,
  text: msg,
  ...(useMarkdown ? { parse_mode: 'Markdown' } : {}),
  disable_web_page_preview: true
});

const req = https.request({
  hostname: 'api.telegram.org',
  path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    const j = JSON.parse(body);
    console.log(j.ok ? '✅ Notificação enviada' : '❌ Erro: ' + j.description);
  });
});
req.write(data);
req.end();
