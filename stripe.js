const https = require('https');

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function stripeRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.stripe.com',
      path: `/v1${endpoint}`,
      method,
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const req = https.request(options, res => {
      let responseData = '';
      res.on('data', c => (responseData += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch {
          resolve({ raw: responseData });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function createCheckoutSession(plan, billing, domain) {
  if (!STRIPE_SECRET) throw new Error('Stripe não configurado');

  const priceIds = {
    starter_monthly: process.env.STRIPE_STARTER_PRICE_ID,
    starter_annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
    pro_monthly: process.env.STRIPE_PRO_PRICE_ID,
    pro_annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  };

  const key = `${plan}_${billing}`;
  const priceId = priceIds[key];
  if (!priceId) throw new Error(`Preço não encontrado: ${key}`);

  const result = await stripeRequest(
    'POST',
    '/checkout/sessions',
    `mode=subscription&success_url=${encodeURIComponent(domain + '/dashboard?session_id={CHECKOUT_SESSION_ID}')}&cancel_url=${encodeURIComponent(domain + '/dashboard')}&line_items[0][price]=${priceId}&line_items[0][quantity]=1`
  );

  if (result.error) throw new Error(result.error.message);
  return result.url;
}

async function createCustomerPortalSession(customerId, domain) {
  if (!STRIPE_SECRET) throw new Error('Stripe não configurado');
  const result = await stripeRequest(
    'POST',
    '/billing_portal/sessions',
    `customer=${customerId}&return_url=${encodeURIComponent(domain + '/dashboard')}`
  );
  if (result.error) throw new Error(result.error.message);
  return result.url;
}

async function cancelSubscription(subscriptionId) {
  if (!STRIPE_SECRET) throw new Error('Stripe não configurado');
  const result = await stripeRequest('DELETE', `/subscriptions/${subscriptionId}`);
  if (result.error) throw new Error(result.error.message);
  return result;
}

module.exports = {
  createCheckoutSession,
  createCustomerPortalSession,
  cancelSubscription,
  STRIPE_SECRET,
  STRIPE_WEBHOOK_SECRET,
};