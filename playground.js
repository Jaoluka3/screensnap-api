const CSS = require('./templates').CSS;

function apiPlayground() {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Testar API · ScreenSnap</title>
<style>${CSS}
.playground{max-width:900px;margin:40px auto;padding:0 24px}
.playground h1{font-size:2em;margin-bottom:8px}
.playground .sub{color:#a1a1aa;margin-bottom:32px}
.tabs{display:flex;gap:4px;margin-bottom:24px;background:#18181b;border-radius:12px;padding:4px;border:1px solid #27272a}
.tab{padding:10px 20px;border-radius:8px;cursor:pointer;font-size:.85em;color:#a1a1aa;border:none;background:transparent}
.tab.active{background:#a855f7;color:#fff}
.tab:hover:not(.active){color:#e4e4e7}
.panel{background:#18181b;border-radius:12px;padding:24px;border:1px solid #27272a;margin-bottom:24px}
.panel h3{font-size:1.1em;margin-bottom:16px}
.field{margin-bottom:16px}
.field label{display:block;margin-bottom:6px;font-size:.85em;color:#a1a1aa}
.field input,.field select{width:100%;padding:12px;background:#09090b;border:1px solid #27272a;border-radius:8px;color:#e4e4e7;font-size:.9em}
.field input:focus,.field select:focus{outline:none;border-color:#a855f7}
.field input::placeholder{color:#52525b}
.btn-test{background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;border:none;padding:12px 28px;border-radius:8px;font-weight:600;cursor:pointer;font-size:.9em}
.btn-test:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(168,85,247,.3)}
.response-box{background:#09090b;border-radius:8px;padding:16px;margin-top:16px;font-family:monospace;font-size:.85em;min-height:60px;white-space:pre-wrap;word-break:break-all;color:#d4d4d8;border:1px solid #27272a;max-height:400px;overflow-y:auto}
.response-box .success{color:#06b6d4}
.response-box .error{color:#ef4444}
.endpoint-url{display:inline-block;background:#09090b;padding:4px 12px;border-radius:4px;font-family:monospace;font-size:.8em;color:#06b6d4;margin-bottom:4px}
.status-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.75em;font-weight:600}
.status-badge.up{background:#065f46;color:#34d399}
.response-meta{color:#52525b;font-size:.8em;margin-top:8px}
.free-note{text-align:center;margin-top:32px;padding:20px;background:#18181b;border-radius:12px;border:1px solid #27272a}
.free-note p{color:#a1a1aa;font-size:.9em}
.free-note .btn{margin-top:12px}
</style></head>
<body><nav class="container"><div class="logo gradient-text">ScreenSnap API</div><div><a href="/">Home</a><a href="#pricing">Preços</a><a href="/docs">Docs</a><a href="/login">Entrar</a></div></nav>
<div class="playground">
<h1 class="gradient-text">Testar API</h1>
<p class="sub">Faça uma chamada real à API. Use <strong>demo</strong> como API Key para testar.</p>

<div class="tabs" id="tabs">
<button class="tab active" data-tab="screenshot">📸 Screenshot</button>
<button class="tab" data-tab="account">👤 Minha Conta</button>
<button class="tab" data-tab="health">❤️ Health</button>
</div>

<div class="panel" id="panel-screenshot">
<h3>📸 POST /v1/screenshot</h3>
<div class="endpoint-url">POST /v1/screenshot</div>
<div class="field"><label>API Key</label><input id="key-screenshot" placeholder="ss_demo_key" value="demo"></div>
<div class="field"><label>URL</label><input id="url" placeholder="https://exemplo.com" value="https://example.com"></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
<div class="field"><label>Largura</label><input id="width" value="1280"></div>
<div class="field"><label>Altura</label><input id="height" value="720"></div>
</div>
<div class="field"><label>Formato</label><select id="format"><option value="png">PNG</option><option value="pdf">PDF</option></select></div>
<button class="btn-test" onclick="testScreenshot()">🚀 Capturar Screenshot</button>
<div id="response-screenshot" class="response-box">Clique em "Capturar Screenshot" para testar...</div>
</div>

<div class="panel" id="panel-account" style="display:none">
<h3>👤 GET /api/me</h3>
<div class="endpoint-url">GET /api/me</div>
<div class="field"><label>API Key</label><input id="key-account" placeholder="ss_sua_chave"></div>
<button class="btn-test" onclick="testAccount()">📊 Ver Minha Conta</button>
<div id="response-account" class="response-box">Insira sua API Key e clique em "Ver Minha Conta"...</div>
</div>

<div class="panel" id="panel-health" style="display:none">
<h3>❤️ GET /health</h3>
<div class="endpoint-url">GET /health</div>
<button class="btn-test" onclick="testHealth()">🔍 Verificar Status</button>
<div id="response-health" class="response-box">Clique em "Verificar Status" para testar...</div>
</div>

<div class="free-note">
<p>🔥 Quer sua própria API Key? <strong>Grátis, sem cartão.</strong></p>
<a href="/signup" class="btn btn-primary">Criar Conta Grátis</a>
</div>
</div>

<script>
const BASE = window.location.origin;

function showTab(name) {
document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
document.querySelectorAll('.panel').forEach(p=>p.style.display='none');
document.querySelector('.tab[data-tab="'+name+'"]').classList.add('active');
document.getElementById('panel-'+name).style.display='block';
}

document.getElementById('tabs').addEventListener('click', function(e) {
if (e.target.classList.contains('tab')) showTab(e.target.dataset.tab);
});

async function testHealth() {
const box = document.getElementById('response-health');
box.textContent = '⏳ Carregando...';
try {
const r = await fetch(BASE+'/health');
const j = await r.json();
box.innerHTML = '<div class="success">✅ Status: '+(j.status||'ok')+'</div><br>'+JSON.stringify(j, null, 2);
} catch(e) { box.innerHTML = '<div class="error">❌ Erro: '+e.message+'</div>'; }
}

async function testAccount() {
const key = document.getElementById('key-account').value;
const box = document.getElementById('response-account');
if (!key) { box.innerHTML = '<div class="error">Digite uma API Key</div>'; return; }
box.textContent = '⏳ Carregando...';
try {
const r = await fetch(BASE+'/api/me', {headers:{'x-api-key':key}});
const j = await r.json();
const status = r.ok ? '<div class="success">✅ '+r.status+'</div>' : '<div class="error">❌ '+r.status+' '+j.error+'</div>';
box.innerHTML = status+'<br>'+JSON.stringify(j, null, 2);
} catch(e) { box.innerHTML = '<div class="error">❌ Erro: '+e.message+'</div>'; }
}

async function testScreenshot() {
const key = document.getElementById('key-screenshot').value;
const url = document.getElementById('url').value;
const width = document.getElementById('width').value;
const height = document.getElementById('height').value;
const format = document.getElementById('format').value;
const box = document.getElementById('response-screenshot');

if (!url) { box.innerHTML = '<div class="error">Digite uma URL</div>'; return; }
box.textContent = '⏳ Capturando...';

try {
const r = await fetch(BASE+'/v1/screenshot', {
method:'POST',
headers:{'Content-Type':'application/json','x-api-key':key},
body:JSON.stringify({url,width:parseInt(width),height:parseInt(height),format})
});
if (r.ok) {
const blob = await r.blob();
const imgUrl = URL.createObjectURL(blob);
const remaining = r.headers.get('X-RateLimit-Remaining');
const limit = r.headers.get('X-RateLimit-Limit');
box.innerHTML = '<div class="success">✅ Capturado! ('+format+', '+blob.size+' bytes)</div>'+
'<div class="response-meta">Rate Limit: '+remaining+'/'+limit+' restantes</div>'+
'<br><img src="'+imgUrl+'" style="max-width:100%;border-radius:8px;border:1px solid #27272a">';
} else {
const j = await r.json();
box.innerHTML = '<div class="error">❌ '+r.status+' '+j.error+'</div>';
}
} catch(e) { box.innerHTML = '<div class="error">❌ Erro: '+e.message+'</div>'; }
}
</script></body></html>`;
}

module.exports = { apiPlayground };