import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';
import { build } from 'esbuild';
import { ReplitConnectors } from '@replit/connectors-sdk';
import { eq } from 'drizzle-orm';

if (process.env.NODE_ENV !== 'test') {
  throw new Error('Run the progress integration suite with NODE_ENV=test.');
}
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must point to the development/test database.');
}

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(testDir, '..');
const tempDir = await mkdtemp(path.join(packageDir, '.progress-integration-'));
const dbPackageDir = path.resolve(packageDir, '../../lib/db');
const dbTempDir = await mkdtemp(path.join(dbPackageDir, '.progress-integration-'));
const dbModulePath = path.join(dbTempDir, 'db.mjs');
const routerPath = path.join(tempDir, 'routes.mjs');
const authModulePath = path.join(testDir, 'progress-test-clerk-auth.mjs');
const testAuthKey = randomBytes(32);
const accountScope = 'acct_progress_sync_fixture:test';
const stripeCustomers = new Map();
const memberships = new Map();
const fixturePrice = {
  id: 'price_progress_sync_fixture',
  active: true,
  currency: 'usd',
  unit_amount: 999,
  livemode: false,
  recurring: { interval: 'month' },
};
const testUsers = [];
let outboxLoadId = 0;
let server;
let baseUrl;

// Compile one shared DB module so the test setup and the production routes use
// the same pool and schema objects.
await build({
  entryPoints: [path.resolve(packageDir, '../../lib/db/src/index.ts')],
  outfile: dbModulePath,
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
});
const {
  billingCustomerScopesTable,
  db,
  learningChallengesTable,
  learningProgressTable,
  learningRoundsTable,
  legalConsentsTable,
  pool,
} = await import(pathToFileURL(dbModulePath).href);

// Replace only the Stripe network boundary. Production membership logic still
// checks the scoped customer, price, and subscription status for each request.
ReplitConnectors.prototype.proxy = async function proxy(connectorName, requestPath, options = {}) {
  assert.equal(connectorName, 'stripe', 'unexpected external connector request');
  assert.equal(options.method ?? 'GET', 'GET', 'progress integration must not make purchases');

  const url = new URL(requestPath, 'https://stripe-fixture.invalid');
  if (url.pathname === '/v1/account') {
    return fixtureResponse({ id: 'acct_progress_sync_fixture' });
  }
  if (url.pathname.startsWith('/v1/customers/')) {
    const customerId = decodeURIComponent(url.pathname.slice('/v1/customers/'.length));
    assert.ok(stripeCustomers.has(customerId), 'only synthetic customers are permitted');
    return fixtureResponse({ id: customerId, livemode: false });
  }
  if (url.pathname === '/v1/prices') {
    assert.deepEqual(url.searchParams.getAll('lookup_keys[]'), ['mandarin_garden_premium_monthly']);
    return fixtureResponse({ data: [fixturePrice] });
  }
  if (url.pathname === '/v1/subscriptions') {
    const customerId = url.searchParams.get('customer');
    assert.ok(stripeCustomers.has(customerId), 'subscriptions must belong to a synthetic customer');
    const status = memberships.get(customerId) ?? 'canceled';
    return fixtureResponse({
      data: [{
        id: `sub_${customerId}`,
        status,
        items: { data: [{ price: { id: fixturePrice.id } }] },
      }],
    });
  }
  throw new Error(`Unexpected Stripe fixture request: ${url.pathname}`);
};

await build({
  entryPoints: [path.join(packageDir, 'src/routes/index.ts')],
  outfile: routerPath,
  bundle: true,
  platform: 'node',
  format: 'esm',
  external: ['@replit/connectors-sdk', 'express', 'pg'],
  plugins: [{
    name: 'progress-test-dependencies',
    setup(buildApi) {
      buildApi.onResolve({ filter: /^@clerk\/express$/ }, () => ({ path: authModulePath }));
      buildApi.onResolve({ filter: /^@workspace\/db$/ }, () => ({
        path: dbModulePath,
        external: true,
      }));
    },
  }],
});
const { default: router } = await import(pathToFileURL(routerPath).href);

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.testAuth = readTestSession(req.headers.authorization);
  req.log = { error() {} };
  next();
});
app.use('/api', router);
server = createServer(app);

after(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
  for (const userId of testUsers) {
    await db.delete(learningRoundsTable).where(eq(learningRoundsTable.clerkUserId, userId));
    try {
      await db.delete(learningChallengesTable).where(eq(learningChallengesTable.clerkUserId, userId));
    } catch (error) {
      if (error?.cause?.code !== '42P01') throw error;
    }
    await db.delete(learningProgressTable).where(eq(learningProgressTable.clerkUserId, userId));
    await db.delete(legalConsentsTable).where(eq(legalConsentsTable.clerkUserId, userId));
    await db.delete(billingCustomerScopesTable).where(eq(billingCustomerScopesTable.clerkUserId, userId));
  }
  await pool.end();
  await rm(tempDir, { recursive: true, force: true });
  await rm(dbTempDir, { recursive: true, force: true });
});

test('authenticated progress sync preserves XP across browsers, sessions, and retries', async () => {
  process.env.MANDARIN_ADMIN_EMAILS = '';
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;

  const familyA = await createSyntheticAccount('active');
  const familyB = await createSyntheticAccount('active');
  const lapsedFamily = await createSyntheticAccount('canceled');
  const browserOne = createBrowser(familyA);
  const browserTwo = createBrowser(familyA);
  const otherFamilyBrowser = createBrowser(familyB);

  assert.equal((await request('/learning/progress')).status, 401, 'requests without a signed session must be rejected');
  assert.equal((await request('/learning/progress', { token: lapsedFamily.token })).status, 403,
    'the production membership check must reject a lapsed synthetic member');
  await acceptConsent(browserOne);
  await acceptConsent(browserTwo);
  await acceptConsent(otherFamilyBrowser);
  await acceptConsent(createBrowser(lapsedFamily));
  assert.equal((await request('/learning/progress', { token: lapsedFamily.token })).status, 403,
    'consent must not replace the active membership requirement');
  for (const mode of ['match', 'pinyin', 'listen', 'word-order', 'sentence-order']) {
    assert.equal((await request('/learning/rounds', {
      token: lapsedFamily.token,
      method: 'POST',
      body: { stage: 1, mode, script: 'trad' },
    })).status, 403, `lapsed memberships cannot obtain ${mode} challenges through a direct request`);
  }

  // Two independent browser stores belong to the same synthetic family.
  browserOne.storage.setItem(`mg-curriculum-progress:${familyA.userId}`, JSON.stringify({ xp: 150 }));
  browserTwo.storage.setItem(`mg-curriculum-progress:${familyA.userId}`, JSON.stringify({ xp: 230 }));
  assert.deepEqual(await importLegacySnapshot(browserOne), {
    selectedStage: 1, xpByStage: [100, 50, 0, 0],
  });

  const firstRound = await issueRound(browserOne, { stage: 2, mode: 'match' });
  const firstQuestion = firstRound.questions[0];
  assert.equal(typeof firstRound.roundId, 'string');
  assert.equal(typeof firstQuestion.id, 'string');
  assert.equal(Object.hasOwn(firstQuestion, 'answer'), false, 'answer keys must stay server-side');
  assert.deepEqual(await postAnswer(browserOne, {
    roundId: firstRound.roundId, questionId: firstQuestion.id, answer: 'client-invented-answer',
  }), { correct: false, selectedStage: 1, xpByStage: [100, 50, 0, 0] },
  'a made-up correct answer must not award XP');
  const firstAnswer = {
    roundId: firstRound.roundId, questionId: firstQuestion.id, answer: firstQuestion.word.trad,
  };
  assert.deepEqual(await postAnswer(browserOne, firstAnswer), {
    correct: true, selectedStage: 1, xpByStage: [100, 55, 0, 0],
  });
  assert.equal((await request('/learning/round', {
    token: browserOne.token,
    method: 'POST',
    body: { stage: 2, mode: 'match', roundId: 'client-made-round-01', correctCount: 5 },
  })).status, 400, 'client-provided scores and round IDs are no longer accepted');
  assert.equal((await postAnswer(browserOne, {
    roundId: '00000000-0000-4000-8000-000000000001',
    questionId: '00000000-0000-4000-8000-000000000002',
    answer: '一',
  })).status, 404, 'new client-generated identities must not be accepted');
  assert.deepEqual(await importLegacySnapshot(browserTwo), {
    selectedStage: 1, xpByStage: [100, 105, 30, 0],
  }, 'a higher second-browser snapshot merges without removing the server-earned round');
  assert.deepEqual(await sendLegacySnapshot(browserOne, 150), {
    selectedStage: 1, xpByStage: [100, 105, 30, 0],
  }, 'a stale snapshot must not duplicate or reduce XP');

  const duplicateRound = await issueRound(browserOne, { stage: 3, mode: 'listen' });
  const duplicateAnswer = {
    roundId: duplicateRound.roundId,
    questionId: duplicateRound.questions[0].id,
    answer: duplicateRound.questions[0].word.trad,
  };
  const duplicateResponses = await Promise.all(Array.from({ length: 8 }, () => postAnswer(browserOne, duplicateAnswer)));
  for (const result of duplicateResponses) {
    assert.deepEqual(result, { correct: true, selectedStage: 1, xpByStage: [100, 105, 35, 0] });
  }

  const otherChallenge = await issueRound(browserOne, { stage: 3, mode: 'listen' });
  assert.equal((await postAnswer(browserOne, {
    roundId: otherChallenge.roundId,
    questionId: duplicateAnswer.questionId,
    answer: duplicateAnswer.answer,
  })).status, 404, 'a question identity cannot be moved to a different issued round');
  assert.deepEqual(await getProgress(browserTwo), {
    selectedStage: 1, xpByStage: [100, 105, 35, 0],
  }, 'invalid answer identities must not mutate saved progress');

  // A fresh request after reload and after logout/login observes server state.
  assert.deepEqual(await getProgress(browserTwo), {
    selectedStage: 1, xpByStage: [100, 105, 35, 0],
  }, 'a separate browser context must see the shared account progress');
  assert.equal((await request('/learning/progress', { token: null })).status, 401,
    'logout removes the browser session');
  assert.deepEqual(await getProgress(browserOne), {
    selectedStage: 1, xpByStage: [100, 105, 35, 0],
  }, 'logging back in restores the same account progress');

  // Persist a pending round in one browser, reload its storage module, replay
  // through the authenticated API, and acknowledge only after server success.
  const outbox = await loadOutbox();
  const pendingRound = await issueRound(browserOne, { stage: 4, mode: 'word-order' });
  const pending = {
    roundId: pendingRound.roundId,
    questionId: pendingRound.questions[0].id,
    answer: pendingRound.questions[0].speakText,
  };
  useBrowserStorage(browserOne);
  outbox.queueRound(familyA.userId, pending);
  const reloadedOutbox = await loadOutbox();
  assert.deepEqual(reloadedOutbox.pendingRounds(familyA.userId), [pending]);
  useBrowserStorage(browserTwo);
  assert.deepEqual(reloadedOutbox.pendingRounds(familyA.userId), [],
    'pending rounds stay in their own browser context');
  useBrowserStorage(browserOne);
  assert.deepEqual(await postAnswer(browserOne, reloadedOutbox.pendingRounds(familyA.userId)[0]), {
    correct: true, selectedStage: 1, xpByStage: [100, 105, 35, 5],
  });
  reloadedOutbox.acknowledgeRound(familyA.userId, pending.roundId, pending.questionId);
  assert.deepEqual(reloadedOutbox.pendingRounds(familyA.userId), []);
  assert.deepEqual(await postAnswer(browserOne, pending), {
    correct: true, selectedStage: 1, xpByStage: [100, 105, 35, 5],
  }, 'replaying an acknowledged or retried round remains idempotent on the server');

  // Account B has independent storage and progress, even if a round identifier
  // is reused across accounts.
  assert.deepEqual(await getProgress(otherFamilyBrowser), {
    selectedStage: 1, xpByStage: [0, 0, 0, 0],
  });
  const otherRound = await issueRound(otherFamilyBrowser, { stage: 1, mode: 'match' });
  assert.deepEqual(await postAnswer(otherFamilyBrowser, {
    roundId: otherRound.roundId,
    questionId: otherRound.questions[0].id,
    answer: otherRound.questions[0].word.trad,
  }), { correct: true, selectedStage: 1, xpByStage: [5, 0, 0, 0] });
  assert.deepEqual(await getProgress(browserOne), {
    selectedStage: 1, xpByStage: [100, 105, 35, 5],
  }, 'another account cannot read or change this family’s XP');

  const selectedStageResponse = await request('/learning/progress', {
    token: browserOne.token,
    method: 'PUT',
    body: { selectedStage: 4 },
  });
  assert.deepEqual(selectedStageResponse.body, {
    selectedStage: 4, xpByStage: [100, 105, 35, 5],
  }, 'the selected stage remains account-owned before starting a game');
  const expectedXp = [100, 105, 35, 5];
  for (const mode of ['match', 'pinyin', 'listen', 'word-order', 'sentence-order']) {
    const round = await issueRound(browserOne, { stage: selectedStageResponse.body.selectedStage, mode });
    assert.equal(round.stage, 4, `${mode} uses the selected fourth-stage word bank`);
    assert.equal(round.mode, mode, `${mode} is selected as soon as its round opens`);
    assert.equal(round.questions.length, 5);
    const question = round.questions[0];
    assert.equal(question.mode, mode);
    assert.equal(Object.hasOwn(question, 'answer'), false, 'answer keys remain server-side');
    const answer = question.kind === 'order'
      ? question.speakText
      : mode === 'pinyin' ? question.word.pinyin : question.word.trad;
    expectedXp[3] += 5;
    assert.deepEqual(await postAnswer(browserOne, {
      roundId: round.roundId,
      questionId: question.id,
      answer,
    }), { correct: true, selectedStage: 4, xpByStage: [...expectedXp] },
    `${mode} awards XP only to the selected fourth stage`);
  }
});

async function createSyntheticAccount(subscriptionStatus) {
  const userId = `progress-it-${randomUUID()}`;
  const customerId = `cus_progress_it_${randomUUID().replaceAll('-', '')}`;
  testUsers.push(userId);
  stripeCustomers.set(customerId, userId);
  memberships.set(customerId, subscriptionStatus);
  await db.insert(billingCustomerScopesTable).values({
    clerkUserId: userId,
    stripeScope: accountScope,
    stripeCustomerId: customerId,
  });
  return { userId, token: issueTestSession(userId), customerId };
}

function createBrowser(account) {
  return { ...account, storage: createStorage() };
}

function createStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    key(index) { return [...values.keys()][index] ?? null; },
  };
}

function useBrowserStorage(browser) {
  globalThis.localStorage = browser.storage;
  globalThis.window = new EventTarget();
}

async function acceptConsent(browser) {
  const response = await request('/legal/consent', {
    token: browser.token,
    method: 'POST',
    body: {
      privacyAccepted: true,
      disclaimerAccepted: true,
      adultConfirmed: true,
      policyVersion: '2026-10-29.1',
    },
  });
  assert.equal(response.status, 200, 'each synthetic account must use the real consent route');
}

async function importLegacySnapshot(browser) {
  const raw = browser.storage.getItem(`mg-curriculum-progress:${browser.userId}`);
  const snapshot = raw ? Number(JSON.parse(raw)?.xp) : 0;
  const result = await sendLegacySnapshot(browser, snapshot);
  browser.storage.setItem(`mg-playground-legacy-migrated:${browser.userId}`, String(snapshot));
  return result;
}

async function sendLegacySnapshot(browser, legacyXpTotal) {
  const response = await request('/learning/progress', {
    token: browser.token,
    method: 'PUT',
    body: { selectedStage: 1, legacyXpTotal },
  });
  assert.equal(response.status, 200, 'legacy snapshots must pass the authenticated progress route');
  return response.body;
}

async function issueRound(browser, { stage, mode, script = 'trad' }) {
  const response = await request('/learning/rounds', {
    token: browser.token,
    method: 'POST',
    body: { stage, mode, script },
  });
  assert.equal(response.status, 201, `round issue failed: ${JSON.stringify(response.body)}`);
  return response.body;
}

async function postAnswer(browser, answer) {
  const response = await request('/learning/round', {
    token: browser.token,
    method: 'POST',
    body: answer,
  });
  if (response.status === 200) return response.body;
  return response;
}

async function getProgress(browser) {
  const response = await request('/learning/progress', { token: browser.token });
  assert.equal(response.status, 200, `progress request failed: ${JSON.stringify(response.body)}`);
  return response.body;
}

async function request(route, { token, method = 'GET', body } = {}) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const response = await fetch(`${baseUrl}/api${route}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

function issueTestSession(userId) {
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + 300,
  })).toString('base64url');
  const signature = createHmac('sha256', testAuthKey).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readTestSession(header) {
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return { userId: null };
  const [payload, signature] = header.slice('Bearer '.length).split('.');
  if (!payload || !signature) return { userId: null };
  const expected = createHmac('sha256', testAuthKey).update(payload).digest();
  let actual;
  try {
    actual = Buffer.from(signature, 'base64url');
  } catch {
    return { userId: null };
  }
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

async function loadOutbox() {
  const result = await build({
    entryPoints: [path.join(testDir, '../../mandarin-garden-web/src/lib/progress-outbox.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}#reload-${++outboxLoadId}`);
}

function fixtureResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
