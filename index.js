const http = require('http');
const url = require('url');
const db = require('./db');
const auth = require('./auth');
const { takeScreenshot } = require('./screenshot');
const stripe = require('./stripe');
const { landing, loginPage, signupPage, docsPage, dashboardPage } = require('./templates');

const PORT = parseInt(process.env.PORT || '3000');
const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`;

function json(res, data, code = 200) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function html(res, content, code = 200) {
  res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(content);
}

function readBody(req) {
  return new Promise(r => {
    let b = '';
    req.on('data', c => (b += c));
    req.on('end', () => {
      try { r(JSON.parse(b)); } catch { r({}); }
    });
  });
}

function parseFormBody(req) {
  return new Promise(r => {
    let b = '';
    req.on('data', c => (b += c));
    req.on('end', () => {
      const params = new URLSearchParams(b);
      const obj = {};
      for (const [k, v] of params) obj[k] = v;
      r(obj);
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, DOMAIN);
  const pathname = parsed.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,x-api-key,Authorization',
    });
    return res.end();
  }

  // ── Pages ──
  if (pathname === '/' && method === 'GET') return html(res, landing(DOMAIN));
  if (pathname === '/login' && method === 'GET') return html(res, loginPage());
  if (pathname === '/signup' && method === 'GET') return html(res, signupPage());
  if (pathname === '/docs' && method === 'GET') return html(res, docsPage(DOMAIN));
  if (pathname === '/dashboard' && method === 'GET') {
    const user = auth.authenticate(req);
    if (!user) return html(res, loginPage());
    const usage = db.getUserUsage(user.userId);
    const limit = db.LIMITS[user.plan] || 100;
    return html(res, dashboardPage({ ...user, apiKey: user.apiKey }, usage, limit));
  }

  if (pathname === '/health' && method === 'GET') {
    return json(res, {
      status: 'ok',
      service: 'ScreenSnap API',
      version: '1.1.0',
      domain: DOMAIN,
      plans: db.LIMITS,
      overage_cents: db.OVERAGE_PRICE_CENTS,
    });
  }

  // ── Auth (JSON + Form) ──
  if (pathname === '/api/auth' && method === 'POST') {
    const contentType = (req.headers['content-type'] || '');
    const body = contentType.includes('application/x-www-form-urlencoded')
      ? await parseFormBody(req)
      : await readBody(req);

    const { action, email, password, plan = 'free' } = body;

    try {
      if (action === 'signup') {
        const result = auth.signup(email, password, plan);
        if (contentType.includes('application/x-www-form-urlencoded')) {
          return html(res, `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Cadastro · ScreenSnap</title><style>${require('./templates').CSS}body{display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;background:#09090b;color:#e4e4e7;font-family:-apple-system,sans-serif}.box{background:#18181b;border-radius:16px;padding:40px;width:100%;max-width:480px;border:1px solid #27272a}.key{background:#09090b;padding:16px;border-radius:8px;font-family:monospace;word-break:break-all;margin:16px 0;color:#06b6d4;font-size:.9em}.btn{display:inline-block;padding:14px 32px;border-radius:12px;font-weight:600;text-decoration:none;margin-top:16px}.btn-primary{background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff}h2{background:linear-gradient(135deg,#a855f7,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}</style></head><body><div class="box"><h2>Conta criada!</h2><p style="color:#a1a1aa;margin-top:8px">Guarde sua API Key:</p><div class="key">${result.api_key}</div><p style="color:#a1a1aa;font-size:.85em">Use no header <code>x-api-key</code></p><a href="/dashboard" class="btn btn-primary">Ir pro Dashboard</a><br><a href="/docs" style="color:#a855f7;font-size:.85em;margin-top:12px;display:inline-block">Ver documentação</a></div></body></html>`);
        }
        return json(res, result, 201);
      }

      if (action === 'login') {
        const result = auth.login(email, password);
        if (contentType.includes('application/x-www-form-urlencoded')) {
          return html(res, `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=/dashboard"><title>Login · ScreenSnap</title></head><body></body></html>`);
        }
        return json(res, result);
      }

      return json(res, { error: 'Ação inválida. Use signup ou login' }, 400);
    } catch (e) {
      if (contentType.includes('application/x-www-form-urlencoded')) {
        return html(res, `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Erro · ScreenSnap</title><style>body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#09090b;color:#e4e4e7;font-family:-apple-system,sans-serif;text-align:center}.box{background:#18181b;border-radius:16px;padding:40px;border:1px solid #ef4444}.btn{display:inline-block;padding:12px 24px;border-radius:8px;color:#fff;background:#a855f7;text-decoration:none;margin-top:16px}</style></head><body><div class="box"><h2 style="color:#ef4444">Erro</h2><p>${e.message}</p><a href="/signup" class="btn">Voltar</a></div></body></html>`);
      }
      const code =
        e.message === 'Email não encontrado' || e.message === 'Senha incorreta'
          ? 401
          : e.message === 'Email já cadastrado'
            ? 409
            : 400;
      return json(res, { error: e.message }, code);
    }
  }

  // ── Account Info ──
  if (pathname === '/api/me' && method === 'GET') {
    const user = auth.authenticate(req);
    if (!user) return json(res, { error: 'API Key inválida' }, 401);

    const data = db.load();
    const u = data.users[user.userId];
    const usage = db.getUserUsage(user.userId);
    const limit = db.LIMITS[u.plan] || 100;
    const remaining = Math.max(0, limit - usage);

    return json(res, {
      user: { id: u.id, email: u.email, plan: u.plan, trialUntil: u.trialUntil },
      usage: { current: usage, limit, remaining },
      overage: { enabled: true, price_cents: db.OVERAGE_PRICE_CENTS },
      api_key: user.apiKey,
    });
  }

  // ── Screenshot ──
  if (pathname === '/v1/screenshot' && method === 'POST') {
    const user = auth.authenticate(req);
    if (!user) {
      return json(res, { error: 'API Key inválida. Cadastre-se em ' + DOMAIN }, 401);
    }

    const data = db.load();
    const u = data.users[user.userId];
    const usage = db.getUserUsage(user.userId);
    const limit = db.LIMITS[u.plan] || 100;
    const remaining = limit - usage;

    if (remaining <= 0) {
      return json(res, {
        error: 'Limite atingido! Faça upgrade.',
        plan: u.plan,
        limit,
        usage,
        upgrade_url: DOMAIN + '/dashboard',
      }, 429);
    }

    const params = await readBody(req);
    if (!params.url) return json(res, { error: 'Parâmetro "url" obrigatório' }, 400);

    try {
      const buf = await takeScreenshot(params.url, {
        width: parseInt(params.width) || 1280,
        height: parseInt(params.height) || 720,
        format: params.format || 'png',
      });

      db.trackUsage(user.userId);

      const ct = params.format === 'pdf' ? 'application/pdf' : 'image/png';
      res.writeHead(200, {
        'Content-Type': ct,
        'Content-Length': String(buf.length),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(Math.max(0, remaining - 1)),
        'Access-Control-Allow-Origin': '*',
      });
      return res.end(buf);
    } catch (e) {
      return json(res, { error: 'Erro no screenshot: ' + e.message }, 500);
    }
  }

  // ── Stripe Checkout ──
  if (pathname === '/api/create-checkout-session' && method === 'POST') {
    const user = auth.authenticate(req);
    if (!user) return json(res, { error: 'API Key inválida' }, 401);

    const ctype = (req.headers['content-type'] || '');
    const body = ctype.includes('application/x-www-form-urlencoded')
      ? await parseFormBody(req)
      : await readBody(req);
    const plan = body.plan || 'starter';
    const billing = body.billing || 'monthly';

    if (!stripe.STRIPE_SECRET) {
      return json(res, { error: 'Stripe não configurado. Configure STRIPE_SECRET_KEY no .env' }, 501);
    }

    try {
      const checkoutUrl = await stripe.createCheckoutSession(plan, billing, DOMAIN);

      const data = db.load();
      data.users[user.userId].pendingPlan = plan;
      data.users[user.userId].pendingBilling = billing;
      db.save(data);

      if (ctype.includes('application/x-www-form-urlencoded')) {
        res.writeHead(302, { Location: checkoutUrl });
        return res.end();
      }

      return json(res, { url: checkoutUrl });
    } catch (e) {
      return json(res, { error: e.message }, 500);
    }
  }

  // ── Stripe Webhook ──
  if (pathname === '/api/stripe-webhook' && method === 'POST') {
    const rawBody = await new Promise(r => {
      let d = '';
      req.on('data', c => (d += c));
      req.on('end', () => r(d));
    });

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return json(res, { error: 'Invalid payload' }, 400);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerEmail = session.customer_email || session.customer_details?.email;

      if (customerEmail) {
        const data = db.load();
        const user = Object.values(data.users).find(
          u => u.email.toLowerCase() === customerEmail.toLowerCase()
        );
        if (user) {
          const newPlan = user.pendingPlan || 'starter';
          auth.upgradeUserPlan(user.id, newPlan);
          delete data.users[user.id].pendingPlan;
          delete data.users[user.id].pendingBilling;
          data.subscriptions[user.id] = {
            stripeCustomer: session.customer,
            stripeSubscription: session.subscription,
            updated: new Date().toISOString(),
          };
          db.save(data);
          console.log(`💰 Pagamento recebido: ${customerEmail} → ${newPlan.toUpperCase()}`);
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const data = db.load();
      const subEntry = Object.entries(data.subscriptions).find(
        ([_, s]) => s.stripeSubscription === sub.id
      );
      if (subEntry) {
        const userId = subEntry[0];
        auth.upgradeUserPlan(userId, 'free');
        delete data.subscriptions[userId];
        db.save(data);
        console.log(`❌ Assinatura cancelada: userId=${userId}`);
      }
    }

    return json(res, { received: true });
  }

  // ── Cancel Subscription ──
  if (pathname === '/api/cancel-subscription' && method === 'POST') {
    const user = auth.authenticate(req);
    if (!user) return json(res, { error: 'API Key inválida' }, 401);

    const data = db.load();
    const sub = data.subscriptions[user.userId];
    if (!sub || !sub.stripeSubscription) {
      return json(res, { error: 'Sem assinatura ativa' }, 400);
    }

    try {
      await stripe.cancelSubscription(sub.stripeSubscription);
      return json(res, { message: 'Assinatura cancelada' });
    } catch (e) {
      return json(res, { error: e.message }, 500);
    }
  }

  return json(res, { error: 'Not found' }, 404);
});

server.listen(PORT, () => {
  console.log(`\n🔥 ScreenSnap API v1.1 · ${DOMAIN}`);
  console.log(`💰 Planos: Free · Starter(R$49/mo | R$499/yr) · Pro(R$149/mo | R$1.499/yr)`);
  console.log(`📊 Overage: R$${(db.OVERAGE_PRICE_CENTS / 100).toFixed(2)}/req extra`);
  console.log(`🚀 Pronto!\n`);
});

module.exports = { server, db, auth, takeScreenshot };