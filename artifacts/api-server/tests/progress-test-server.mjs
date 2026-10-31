import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import express from 'express';
import { ReplitConnectors } from '@replit/connectors-sdk';
import { pathToFileURL } from 'node:url';

const { PROGRESS_TEST_ROUTER_PATH, PROGRESS_TEST_DB_PATH, PROGRESS_TEST_AUTH_KEY, PROGRESS_TEST_STRIPE_CUSTOMER_ID } = process.env;
if (!PROGRESS_TEST_ROUTER_PATH || !PROGRESS_TEST_DB_PATH || !PROGRESS_TEST_AUTH_KEY || !PROGRESS_TEST_STRIPE_CUSTOMER_ID) {
  throw new Error('Missing progress integration worker configuration.');
}

const fixturePrice = {
  id: 'price_progress_sync_fixture',
  active: true,
  currency: 'usd',
  unit_amount: 999,
  livemode: false,
  recurring: { interval: 'month' },
};

ReplitConnectors.prototype.proxy = async function proxy(connectorName, requestPath, options = {}) {
  if (connectorName !== 'stripe' || (options.method ?? 'GET') !== 'GET') {
    throw new Error('The progress integration worker permits only Stripe fixture reads.');
  }
  const url = new URL(requestPath, 'https://stripe-fixture.invalid');
  if (url.pathname === '/v1/account') return fixtureResponse({ id: 'acct_progress_sync_fixture' });
  if (url.pathname === `/v1/customers/${PROGRESS_TEST_STRIPE_CUSTOMER_ID}`) {
    return fixtureResponse({ id: PROGRESS_TEST_STRIPE_CUSTOMER_ID, livemode: false });
  }
  if (url.pathname === '/v1/prices') return fixtureResponse({ data: [fixturePrice] });
  if (url.pathname === '/v1/subscriptions') {
    if (url.searchParams.get('customer') !== PROGRESS_TEST_STRIPE_CUSTOMER_ID) {
      throw new Error('The progress integration worker received an unexpected customer.');
    }
    return fixtureResponse({
      data: [{
        id: `sub_${PROGRESS_TEST_STRIPE_CUSTOMER_ID}`,
        status: 'active',
        items: { data: [{ price: { id: fixturePrice.id } }] },
      }],
    });
  }
  throw new Error(`Unexpected Stripe fixture request: ${url.pathname}`);
};

const { default: router } = await import(pathToFileURL(PROGRESS_TEST_ROUTER_PATH).href);
const { pool } = await import(pathToFileURL(PROGRESS_TEST_DB_PATH).href);
const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.testAuth = readTestSession(req.headers.authorization);
  req.log = { error() {} };
  next();
});
app.use('/api', router);

const server = createServer(app);
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
console.log(`PROGRESS_TEST_READY:${server.address().port}`);

process.once('SIGTERM', () => {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
});

function readTestSession(header) {
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return { userId: null };
  const [payload, signature] = header.slice('Bearer '.length).split('.');
  if (!payload || !signature) return { userId: null };
  const expected = createHmac('sha256', Buffer.from(PROGRESS_TEST_AUTH_KEY, 'hex'))
    .update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return { userId: null };
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof claims.sub !== 'string' || !Number.isInteger(claims.exp) ||
      claims.exp < Math.floor(Date.now() / 1000)) return { userId: null };
    return { userId: claims.sub };
  } catch {
    return { userId: null };
  }
}

function fixtureResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
