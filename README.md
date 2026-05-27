# ScreenSnap API 🔥

**Screenshot & PDF como Serviço — Micro SaaS para gerar R$100+/dia**

Transforme qualquer URL em screenshot ou PDF com uma chamada de API.

## 💰 Planos

| Plano | Preço | Limite | Anual | Extra |
|-------|-------|--------|-------|-------|
| Free | R$0 | 100/mês | - | - |
| Starter | **R$49/mês** | 1.500/mês | **R$499/ano** (economize R$89) |
| Pro | **R$149/mês** | 5.000/mês | **R$1.499/ano** (economize R$289) |
| Overage | R$0,05/req | Ilimitado | - | Após limite mensal |

## 🚀 Deploy no Railway (5 minutos)

1. Crie conta em [railway.app](https://railway.app)
2. Conecte seu GitHub
3. New Project → Deploy from GitHub repo
4. Railway detecta Node.js automaticamente
5. Adicione variáveis de ambiente:

| Variável | Exemplo | Obrigatória |
|----------|---------|-------------|
| `DOMAIN` | `https://seu-site.up.railway.app` | ✅ |
| `TELEGRAM_TOKEN` | Seu token do Telegram | ❌ (opcional) |
| `TELEGRAM_CHAT_ID` | Seu chat ID | ❌ (opcional) |
| `STRIPE_SECRET_KEY` | `sk_test_...` | ❌ (para cobrar) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ❌ (para cobrar) |

6. Adicione Health Check: `/health`

### VPS (Ubuntu)
```bash
apt update && apt install -y nodejs npm chromium-browser
git clone <seu-repo> && cd opensaas
npm i
DATA_DIR=/data node index.js
```

## 📚 API

```bash
# Autenticação
curl -X POST https://seu-site.com/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"signup","email":"user@email.com","password":"senha123"}'

# Screenshot
curl -X POST https://seu-site.com/v1/screenshot \
  -H "x-api-key: ss_SUA_CHAVE" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://exemplo.com","format":"png"}' \
  -o screenshot.png

# Ver uso
curl -H "x-api-key: ss_SUA_CHAVE" https://seu-site.com/api/me

# Health check
curl https://seu-site.com/health
```

## 🏗️ Arquitetura

```
opensaas/
├── index.js        ← Router principal (HTTP server)
├── db.js           ← Banco JSON com locking
├── auth.js         ← Autenticação (pbkdf2 + salt)
├── screenshot.js   ← Engine de screenshot (3 fallbacks)
├── templates.js    ← Páginas HTML
├── stripe.js       ← Integração Stripe
├── notify.js       ← Notificações Telegram
├── .env            ← Config (gitignorado)
├── .gitignore
├── package.json
└── railway.toml
```

## 🛡️ Stack

- **Runtime:** Node.js (HTTP nativo, zero frameworks)
- **Screenshots:** Chromium headless + Puppeteer + HTTP fetch
- **Banco:** JSON file com file locking (anti-corrupção)
- **Auth:** API Key via pbkdf2 + salt (SHA-512, 100k iterações)
- **Pagamento:** Stripe Checkout + Webhooks
- **Notificações:** Telegram
- **Deploy:** Railway (nixpacks)

## 📊 Projeção R$100/dia

| Cenário | Clientes | Receita/mês | Receita/dia |
|---------|----------|-------------|-------------|
| Meta | 7 Pro + 10 Starter | **R$1.543** | **~R$51** |
| Stretch | 20 Pro | **R$2.980** | **~R$99** |
| Ideal | 20 Pro + overage | **R$3.000+** | **R$100+** |

## Licença

MIT — Use, modifique, venda.
