# How I Built a Screenshot API SaaS in 24 Hours (and Got My First Paying Customer)

*A step-by-step guide to building and monetizing a Screenshot API service*

---

## The Problem

I needed a way to automatically capture website screenshots for my portfolio. Existing services were either too expensive ($49/month for 5,000 screenshots) or too complex to set up.

So I built my own: **ScreenSnap API** — a Screenshot & PDF as a Service platform.

## The Stack

- **Runtime:** Node.js (no frameworks, just native HTTP)
- **Screenshots:** Puppeteer + Chromium headless
- **Database:** JSON file with file locking (anti-corruption)
- **Auth:** API Key via pbkdf2 + salt (SHA-512, 100k iterations)
- **Payments:** Stripe Checkout + Webhooks
- **Deploy:** Railway (nixpacks)

## Key Features

1. **One API call** to capture any website as PNG, JPEG, or PDF
2. **Full page screenshots** with custom dimensions
3. **Rate limiting** with monthly quotas per plan
4. **Referral system** — users earn +50 requests per referral
5. **Telegram notifications** for new signups and daily reports

## Pricing Strategy

After analyzing competitors (ScreenshotAPI.net, Urlbox, ScreenshotOne), I positioned ScreenSnap at:

| Plan | Price | Requests |
|------|-------|----------|
| Free | R$0 | 100/month |
| Starter | R$79/month | 1,500/month |
| Pro | R$199/month | 5,000/month |

**Why these prices?**
- 50-70% cheaper than competitors
- Free tier for developers to test
- Overage at R$0.05/request for flexibility

## Revenue Projection

| Scenario | Customers | Monthly Revenue |
|----------|-----------|-----------------|
| Conservative | 10 Starter + 5 Pro | R$1,785 |
| Moderate | 15 Starter + 10 Pro | R$3,175 |
| Ideal | 20 Pro + overage | R$4,000+ |

## Getting First Customers

1. **Product Hunt launch** — free traffic from developer community
2. **RapidAPI listing** — passive discovery from API marketplace
3. **SEO articles** — "How to take website screenshots programmatically"
4. **Referral program** — existing users bring new users

## Lessons Learned

1. **Start simple** — JSON database is fine for MVP
2. **Price higher** — cheap prices signal low quality
3. **Free tier is essential** — developers need to test before buying
4. **Automate notifications** — Telegram alerts keep you informed
5. **Referrals work** — +50 requests bonus drives organic growth

## Try It Yourself

```bash
# 1. Sign up (free)
curl -X POST https://screensnap-api.up.railway.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"signup","email":"you@email.com","password":"yourpass","plan":"free"}'

# 2. Take a screenshot
curl -X POST https://screensnap-api.up.railway.app/v1/screenshot \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' \
  -o screenshot.png
```

## What's Next

- [ ] Screenshot caching for repeat requests
- [ ] Async rendering with webhooks
- [ ] SDKs for Python, Node.js, PHP
- [ ] Zapier/Make integration
- [ ] Product Hunt launch

---

**Built with ❤️ by [Your Name]**

*ScreenSnap API — Screenshot & PDF as a Service*
