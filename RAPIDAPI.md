# 🚀 RapidAPI Listing Guide

## Por que RapidAPI?
- **3 milhões+ de developers** procurando APIs
- **Marketplace integrado** — billing e discovery automáticos
- **Tráfego orgânico** — developers encontram sua API por busca

## Como listar (10 minutos)

### 1. Criar conta
1. Acesse https://rapidapi.com/provider
2. Faça login com GitHub ou email
3. Complete o perfil do provedor

### 2. Criar API
1. Clique **"Add New API"**
2. Nome: `ScreenSnap API`
3. Descrição: `Screenshot & PDF as a Service - Capture any website as PNG, JPEG, or PDF with one API call`
4. Categoria: `Data` ou `Tools`
5. Website: `https://screensnap-api.up.railway.app`

### 3. Configurar endpoints
Adicione os endpoints:

#### POST /v1/screenshot
- **Description:** Capture website screenshot
- **Method:** POST
- **URL:** `https://screensnap-api.up.railway.app/v1/screenshot`
- **Headers:**
  - `x-api-key`: string (required)
  - `Content-Type`: `application/json`
- **Body:**
```json
{
  "url": "https://example.com",
  "width": 1280,
  "height": 720,
  "format": "png"
}
```

#### GET /api/me
- **Description:** Get account info and usage
- **Method:** GET
- **URL:** `https://screensnap-api.up.railway.app/api/me`
- **Headers:**
  - `x-api-key`: string (required)

#### GET /health
- **Description:** Health check
- **Method:** GET
- **URL:** `https://screensnap-api.up.railway.app/health`

### 4. Configurar pricing
No RapidAPI, configure os planos:

| Plano | Preço | Requests/mês |
|-------|-------|--------------|
| Basic | $9 | 1,000 |
| Pro | $29 | 10,000 |
| Ultra | $99 | 100,000 |

### 5. Publicar
1. Clique **"Publish"**
2. Aguarde aprovação (geralmente 1-2 dias)
3. Sua API estará disponível em `https://rapidapi.com/yourusername/api/screensnap-api`

## Estratégia de crescimento

1. **SEO no RapidAPI** — use keywords como "screenshot", "website capture", "PDF generation"
2. **Documentação clara** — exemplos de código em múltiplas linguagens
3. **Suporte rápido** — responda dúvidas em até 24h
4. **Atualizações regulares** — adicione features e melhore performance

## Métricas para acompanhar

- **Subscribes** — quantos developers se inscreveram
- **API calls** — volume de requisições
- **Revenue** — receita gerada
- **Conversion rate** — % de visitors que se inscrevem

---

**Objetivo:** 50+ subscribers no primeiro mês = ~$500/mês de receita passiva
