const http = require('http');
const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

async function takeScreenshot(url, opts = {}) {
  const { width = 1280, height = 720, format = 'png' } = opts;

  try {
    const tmp = `/tmp/ss_${Date.now()}.png`;
    execSync(
      `xvfb-run --auto-servernum chromium-browser --headless --no-sandbox --disable-gpu --window-size=${width},${height} --screenshot="${tmp}" --virtual-time-budget=5000 "${url}"`,
      { timeout: 15000, stdio: 'ignore' }
    );
    if (fs.existsSync(tmp)) {
      const buf = fs.readFileSync(tmp);
      fs.unlinkSync(tmp);
      return buf;
    }
    try { fs.unlinkSync(tmp); } catch {}
  } catch {}

  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-gpu', '--single-process'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    const buf =
      format === 'pdf'
        ? await page.pdf({ format: 'A4' })
        : await page.screenshot({ type: 'png' });
    await browser.close();
    return buf;
  } catch {}

  return new Promise(resolve => {
    const fetcher = url.startsWith('https') ? https : http;
    fetcher.get(url, { timeout: 10000 }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', () => resolve(Buffer.from('Error: could not fetch URL')));
  });
}

module.exports = { takeScreenshot };