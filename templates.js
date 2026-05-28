const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;background:#09090b;color:#e4e4e7;line-height:1.6}.container{max-width:1100px;margin:0 auto;padding:0 24px}.btn{display:inline-block;padding:14px 32px;border-radius:12px;font-weight:600;text-decoration:none;transition:all .2s;cursor:pointer}.btn-primary{background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff}.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(168,85,247,.3)}.btn-secondary{border:2px solid #27272a;color:#e4e4e7;background:transparent}.btn-secondary:hover{border-color:#a855f7;color:#a855f7}.gradient-text{background:linear-gradient(135deg,#a855f7,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}`;

function landing(domain) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="API de Screenshot e PDF como Serviço. Transforme qualquer URL em imagem com uma chamada de API."><title>ScreenSnap API — Screenshot & PDF como Serviço</title>
<style>${CSS}
.hero{text-align:center;padding:80px 0 50px}.hero h1{font-size:3em;font-weight:900;margin-bottom:16px}.hero p{font-size:1.2em;color:#a1a1aa;max-width:600px;margin:0 auto 36px}.demo{background:#18181b;border-radius:16px;padding:24px;margin:40px auto;max-width:650px;text-align:left;border:1px solid #27272a;font-family:monospace;color:#d4d4d8;overflow-x:auto}.demo .cmd{color:#06b6d4}.demo .key{color:#a855f7}.pricing{padding:80px 0}.pricing h2{text-align:center;font-size:2em;margin-bottom:48px}.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}.plan{background:#18181b;border-radius:16px;padding:36px 28px;border:1px solid #27272a;position:relative}.plan.featured{border-color:#a855f7;background:linear-gradient(135deg,#18181b,#1e1030)}.plan .badge{position:absolute;top:-12px;right:20px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;padding:4px 14px;border-radius:20px;font-size:.75em;font-weight:700}.plan h3{font-size:1.3em;margin-bottom:4px}.plan .price{font-size:2.5em;font-weight:900;margin:16px 0 8px}.plan .price span{font-size:.4em;color:#a1a1aa;font-weight:400}.plan ul{list-style:none;margin:20px 0}.plan ul li{padding:6px 0;color:#a1a1aa;font-size:.9em}.plan ul li::before{content:'✓ ';color:#06b6d4;font-weight:700}.plan .btn{width:100%;text-align:center}nav{padding:20px 0;display:flex;justify-content:space-between;align-items:center}nav .logo{font-size:1.4em;font-weight:800}nav a{color:#a1a1aa;text-decoration:none;margin-left:20px;font-size:.9em}nav a:hover{color:#fff}footer{text-align:center;padding:40px 0;color:#52525b;font-size:.85em}footer a{color:#52525b}@media(max-width:768px){.hero h1{font-size:2em}.plans{grid-template-columns:1fr}}</style></head>
<body><nav class="container"><div class="logo gradient-text">ScreenSnap API</div><div><a href="#pricing">Preços</a><a href="/play">Testar API</a><a href="/docs">Docs</a><a href="/login">Entrar</a></div></nav>
<section class="hero container"><h1 class="gradient-text">Screenshots & PDFs<br>como API</h1><p>Transforme qualquer URL em screenshot ou PDF com uma chamada de API. Rápido, barato e pronto pra produção.</p><a href="/signup" class="btn btn-primary">Começar Grátis</a><a href="#pricing" class="btn btn-secondary" style="margin-left:12px">Ver Planos</a>
<div class="demo"><span class="cmd">curl</span> -X POST <span class="key">${domain}/v1/screenshot</span> \\<br>  -H <span style="color:#06b6d4">"x-api-key: YOUR_KEY"</span> -H <span style="color:#06b6d4">"Content-Type: application/json"</span> \\<br>  -d <span style="color:#e4e4e7">'{"url":"https://example.com"}'</span> -o screenshot.png</div></section>
<section class="pricing container" id="pricing"><h2>Planos que cabem no bolso</h2><div class="plans">
<div class="plan"><h3>Free</h3><div class="price">R$0<span>/mês</span></div><ul><li>100 screenshots/mês</li><li>Resolução HD (1280x720)</li><li>1 API Key</li></ul><a href="/signup" class="btn btn-secondary">Começar Grátis</a></div>
<div class="plan featured"><div class="badge">Mais Popular</div><h3>Starter</h3><div class="price">R$49<span>/mês</span></div><ul><li>1.500 screenshots/mês</li><li>Full HD + Full Page</li><li>PDF incluso</li><li>Suporte prioritário</li><li>3 API Keys</li></ul><a href="/signup?plan=starter" class="btn btn-primary">Assinar Starter</a></div>
<div class="plan"><h3>Pro</h3><div class="price">R$149<span>/mês</span></div><ul><li>5.000 screenshots/mês</li><li>4K e Custom Size</li><li>PDF ilimitado</li><li>Suporte 24/7</li><li>API Keys ilimitadas</li></ul><a href="/signup?plan=pro" class="btn btn-primary">Assinar Pro</a></div></div></section>
<footer><div class="container">ScreenSnap API © 2025 · <a href="/terms">Termos</a> · <a href="/privacy">Privacidade</a></div></footer></body></html>`;
}

function loginPage() {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Entrar · ScreenSnap</title><style>${CSS}body{display:flex;align-items:center;justify-content:center;min-height:100vh}.box{background:#18181b;border-radius:16px;padding:40px;width:100%;max-width:400px;border:1px solid #27272a}.box h1{font-size:1.5em;margin-bottom:4px}.sub{color:#a1a1aa;margin-bottom:24px;font-size:.9em}.field{margin-bottom:16px}label{display:block;margin-bottom:6px;font-size:.85em;color:#a1a1aa}input{width:100%;padding:12px;background:#09090b;border:1px solid #27272a;border-radius:8px;color:#e4e4e7;font-size:.9em}input:focus{outline:none;border-color:#a855f7}button{width:100%;padding:14px;border-radius:10px;font-size:1em;font-weight:600;cursor:pointer;margin-top:8px;border:none}.link{text-align:center;margin-top:16px;font-size:.85em;color:#a1a1aa}.link a{color:#a855f7;text-decoration:none}</style></head>
<body><div class="box"><h1 class="gradient-text">Bem-vindo de volta</h1><p class="sub">Entre na sua conta</p><form action="/api/auth" method="POST"><input type="hidden" name="action" value="login"><div class="field"><label>Email</label><input type="email" name="email" required></div><div class="field"><label>Senha</label><input type="password" name="password" required></div><button class="btn-primary btn" type="submit">Entrar</button></form><p class="link">Não tem conta? <a href="/signup">Criar conta</a></p></div></body></html>`;
}

function signupPage() {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Criar Conta · ScreenSnap</title><style>${CSS}body{display:flex;align-items:center;justify-content:center;min-height:100vh}.box{background:#18181b;border-radius:16px;padding:40px;width:100%;max-width:420px;border:1px solid #27272a}.box h1{font-size:1.5em;margin-bottom:4px}.sub{color:#a1a1aa;margin-bottom:24px;font-size:.9em}.field{margin-bottom:16px}label{display:block;margin-bottom:6px;font-size:.85em;color:#a1a1aa}input,select{width:100%;padding:12px;background:#09090b;border:1px solid #27272a;border-radius:8px;color:#e4e4e7;font-size:.9em}input:focus,select:focus{outline:none;border-color:#a855f7}select{appearance:none}button{width:100%;padding:14px;border-radius:10px;font-size:1em;font-weight:600;cursor:pointer;margin-top:8px;border:none}.link{text-align:center;margin-top:16px;font-size:.85em;color:#a1a1aa}.link a{color:#a855f7;text-decoration:none}</style></head>
<body><div class="box"><h1 class="gradient-text">Criar Conta</h1><p class="sub">Grátis, sem cartão de crédito</p><form action="/api/auth" method="POST"><input type="hidden" name="action" value="signup"><input type="hidden" name="ref" id="refInput"><div class="field"><label>Email</label><input type="email" name="email" required placeholder="seu@email.com"></div><div class="field"><label>Senha</label><input type="password" name="password" required minlength="6" placeholder="Mínimo 6 caracteres"></div><div class="field"><label>Plano</label><select name="plan"><option value="free">Free · R$0/mês (100 reqs)</option><option value="starter">Starter · R$49/mês (1.500 reqs)</option><option value="pro">Pro · R$149/mês (5.000 reqs)</option></select></div><button class="btn-primary btn" type="submit">Criar Conta</button></form><p class="link">Já tem conta? <a href="/login">Entrar</a></p></div>
<script>const p=new URLSearchParams(window.location.search);if(p.get('ref'))document.getElementById('refInput').value=p.get('ref');</script></body></html>`;
}

function docsPage(domain) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Docs · ScreenSnap API</title><style>${CSS}pre{background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;overflow-x:auto;margin:16px 0;font-size:.9em;color:#d4d4d8;line-height:1.6}code{color:#06b6d4}h2{margin:40px 0 16px;font-size:1.5em}.endpoint{background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin:16px 0}</style></head>
<body><nav class="container" style="margin:0 auto 40px;padding-top:20px"><div class="logo gradient-text">ScreenSnap Docs</div><div><a href="/">Home</a><a href="/login">Entrar</a></div></nav>
<div class="container"><h1 class="gradient-text" style="font-size:2em;margin-bottom:8px">Documentação</h1><p style="color:#a1a1aa;margin-bottom:40px">Tudo que você precisa para usar a ScreenSnap API.</p>
<h2>Autenticação</h2><p style="color:#a1a1aa">Header <code>x-api-key</code> em todas as requisições.</p>
<pre><code>curl -H "x-api-key: ss_YOUR_KEY" ${domain}/v1/health</code></pre>
<h2>Endpoints</h2>
<div class="endpoint"><h3 style="color:#a855f7">POST /v1/screenshot</h3><p style="color:#a1a1aa">Gera screenshot ou PDF de uma URL.</p><pre>{
  "url": "https://exemplo.com",
  "width": 1280, "height": 720,
  "fullPage": false, "format": "png"
}</pre></div>
<div class="endpoint"><h3 style="color:#a855f7">GET /api/me</h3><p style="color:#a1a1aa">Informações da sua conta e uso atual.</p></div>
<div class="endpoint"><h3 style="color:#a855f7">POST /api/upgrade</h3><p style="color:#a1a1aa">Faz upgrade de plano via Stripe.</p></div>
<h2>Planos</h2>
<table style="width:100%;border-collapse:collapse;margin:20px 0"><tr style="border-bottom:1px solid #27272a"><th style="text-align:left;padding:12px">Plano</th><th style="text-align:left;padding:12px">Reqs/mês</th><th style="text-align:left;padding:12px">Preço</th><th style="text-align:left;padding:12px">Anual</th></tr>
<tr style="border-bottom:1px solid #27272a"><td style="padding:12px">Free</td><td style="padding:12px">100</td><td style="padding:12px;color:#06b6d4">R$0</td><td style="padding:12px">-</td></tr>
<tr style="border-bottom:1px solid #27272a"><td style="padding:12px">Starter</td><td style="padding:12px">1.500</td><td style="padding:12px;color:#06b6d4">R$49/mês</td><td style="padding:12px;color:#06b6d4">R$499/ano</td></tr>
<tr style="border-bottom:1px solid #27272a"><td style="padding:12px">Pro</td><td style="padding:12px">5.000</td><td style="padding:12px;color:#06b6d4">R$149/mês</td><td style="padding:12px;color:#06b6d4">R$1.499/ano</td></tr></table>
<p style="color:#a1a1aa;font-size:.85em;margin-top:8px">+ R$0,05 por screenshot excedente (overage)</p></div></body></html>`;
}

function dashboardPage(user, usage, limit) {
  const usagePct = limit ? Math.min(100, Math.round((usage / limit) * 100)) : 0;
  const barColor = usagePct > 80 ? '#ef4444' : usagePct > 60 ? '#f59e0b' : '#06b6d4';
  const referralLink = user.domain ? `${user.domain}/signup?ref=${user.userId}` : `/signup?ref=${user.userId}`;
  const bonus = user.referralBonus || 0;
  const effectiveLimit = limit + bonus;

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dashboard · ScreenSnap</title><style>${CSS}body{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:40px 0}.card{background:#18181b;border-radius:16px;padding:40px;width:100%;max-width:540px;border:1px solid #27272a;margin:0 24px}.card h1{font-size:1.5em;margin-bottom:8px}.sub{color:#a1a1aa;margin-bottom:24px;font-size:.9em}.row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #27272a}.row span:first-child{color:#a1a1aa}.row span:last-child{font-weight:600;word-break:break-all}.progress{background:#27272a;border-radius:8px;height:10px;margin:12px 0 20px;overflow:hidden}.progress-fill{background:${barColor};height:100%;width:${usagePct}%;border-radius:8px;transition:width .3s}.btn{width:100%;padding:14px;border-radius:10px;font-size:1em;font-weight:600;cursor:pointer;margin-top:8px;border:none;text-align:center;display:block}.pct{font-size:.85em;color:#a1a1aa;text-align:right}.referral{background:#1e1030;border:1px solid #a855f7;border-radius:12px;padding:16px;margin:20px 0}.referral h4{color:#a855f7;font-size:.95em;margin-bottom:8px}.referral p{color:#a1a1aa;font-size:.85em;margin-bottom:8px}.referral .ref-link{background:#09090b;padding:10px;border-radius:8px;font-family:monospace;font-size:.8em;word-break:break-all;color:#06b6d4;cursor:pointer}</style></head>
<body><div class="card"><h1 class="gradient-text">Dashboard</h1><p class="sub">${user.email}</p>
<div class="row"><span>Plano</span><span style="color:#a855f7">${user.plan.toUpperCase()}</span></div>
<div class="row"><span>API Key</span><span style="font-family:monospace;font-size:.8em">${user.apiKey}</span></div>
<div class="row"><span>Limite mensal</span><span>${usage} / ${effectiveLimit} ${bonus > 0 ? '(+' + bonus + ' bônus)' : ''}</span></div>
<div class="progress"><div class="progress-fill"></div></div>
<p class="pct">${usagePct}% do limite</p>
${usagePct >= 80 ? '<p style="color:#ef4444;font-size:.85em;margin-bottom:16px">⚠️ Você está quase no limite! Faça upgrade ou indique amigos para ganhar mais requests.</p>' : ''}
${user.plan !== 'pro' ? `<form action="/api/create-checkout-session" method="POST"><input type="hidden" name="plan" value="${user.plan === 'free' ? 'starter' : 'pro'}"><input type="hidden" name="billing" value="monthly"><button class="btn btn-primary" type="submit">⬆️ Fazer Upgrade</button></form>` : ''}

<div class="referral">
<h4>🎯 Indique e Ganhe!</h4>
<p>Compartilhe seu link. Cada amigo que se cadastrar te dá <strong>+50 requests</strong> grátis!</p>
<div class="ref-link" id="refLink">${referralLink}</div>
<button class="btn btn-secondary" style="margin-top:8px;padding:8px;font-size:.85em" onclick="navigator.clipboard.writeText('${referralLink}');this.textContent='✅ Copiado!'">📋 Copiar Link</button>
</div>

<a href="/docs" class="btn btn-secondary" style="margin-top:8px">📚 Documentação</a>
</div></body></html>`;
}

module.exports = { CSS, landing, loginPage, signupPage, docsPage, dashboardPage };