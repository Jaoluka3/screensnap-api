# 🚀 Deploy ScreenSnap API

## Railway (Recomendado — 5 minutos)

### 1. Criar conta e projeto
1. Acesse https://railway.app
2. Faça login com GitHub (conta `Jaoluka3`)
3. Clique **"New Project"** → **"Deploy from GitHub repo"**
4. Selecione `Jaoluka3/screensnap-api`

### 2. Configurar variáveis de ambiente
No painel do Railway, vá em **Variables** e adicione:

```
PORT=3000
DOMAIN=https://seu-app.up.railway.app
DATA_DIR=./data
TELEGRAM_TOKEN=8801080682:AAECOhXVwV4Yb-bWfgnp4-k6jPKPwD53BO8
TELEGRAM_CHAT_ID=7376564457
STRIPE_SECRET_KEY=sk_test_SUA_STRIPE_KEY_AQUI
STRIPE_WEBHOOK_SECRET=whsec_xxx (configurar depois)
STRIPE_STARTER_PRICE_ID=price_1TcbZKLgk5X1NOLmm7y3HtHe
STRIPE_STARTER_ANNUAL_PRICE_ID=price_1TcbZjLgk5X1NOLmQ6UDOEnX
STRIPE_PRO_PRICE_ID=price_1TcbZlLgk5X1NOLmc60lV0Ob
STRIPE_PRO_ANNUAL_PRICE_ID=price_1TcbZnLgk5X1NOLmCtgM8fmu
OVERAGE_UNIT_PRICE_CENTS=5
```

### 3. Health check
- Railway detecta automaticamente via `railway.toml`
- Endpoint: `/health`

### 4. Verificar deploy
```bash
curl https://seu-app.up.railway.app/health
```

### 5. Configurar Stripe webhook (após deploy)
1. No Stripe Dashboard → Developers → Webhooks
2. Adicionar endpoint: `https://seu-app.up.railway.app/api/stripe-webhook`
3. Eventos: `checkout.session.completed`, `customer.subscription.deleted`
4. Copiar `whsec_xxx` para `STRIPE_WEBHOOK_SECRET` no Railway

---

## Render.com (Alternativa — 7 minutos)

1. Acesse https://render.com
2. Faça login com GitHub
3. **New** → **Web Service**
4. Conecte `Jaoluka3/screensnap-api`
5. Configure:
   - **Name:** screensnap-api
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Plan:** Free
6. Adicione as mesmas variáveis de ambiente do Railway
7. Clique **Create Web Service**

---

## Verificação pós-deploy

```bash
# Health check
curl https://seu-app.up.railway.app/health

# Criar conta
curl -X POST https://seu-app.up.railway.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"signup","email":"test@test.com","password":"123456","plan":"free"}'

# Screenshot
curl -X POST https://seu-app.up.railway.app/v1/screenshot \
  -H "x-api-key: ss_SUA_CHAVE" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' \
  -o screenshot.png
```
