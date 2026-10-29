import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

async function load(path) {
  const result = await build({
    entryPoints: [new URL(path, import.meta.url).pathname],
    bundle: true, platform: 'node', format: 'esm', write: false,
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

const { mergeLegacyProgress } = await load('../src/learning-progress.ts');

test('legacy curriculum keeps 100 XP per stage and never reduces earned XP', () => {
  assert.deepEqual(mergeLegacyProgress([0, 0, 0, 0], 235, [0, 0, 0, 0]), [100, 100, 35, 0]);
  assert.deepEqual(mergeLegacyProgress([140, 0, 15, 0], 100, [40, 0, 15, 0]), [140, 0, 15, 0]);
});

test('imports are idempotent before and after server rounds, without losing new awards', () => {
  const earned = [25, 10, 0, 0];
  const first = mergeLegacyProgress([25, 10, 0, 0], 150, earned);
  assert.deepEqual(first, [125, 60, 0, 0]);
  assert.deepEqual(mergeLegacyProgress(first, 150, earned), first);
  const afterRound = [150, 60, 0, 0];
  assert.deepEqual(mergeLegacyProgress(afterRound, 150, [50, 10, 0, 0]), afterRound);
});

test('a higher snapshot from a second browser merges, but an older one never doubles it', () => {
  const earned = [25, 10, 0, 0];
  const first = mergeLegacyProgress([0, 0, 0, 0], 150, earned);
  const higher = mergeLegacyProgress(first, 230, earned);
  assert.deepEqual(higher, [125, 110, 30, 0]);
  assert.deepEqual(mergeLegacyProgress(higher, 150, earned), higher);
  assert.deepEqual(mergeLegacyProgress(higher, 230, earned), higher);
});

const { questionAwardId, queueRound, pendingRounds, acknowledgeRound } = await load('../../mandarin-garden-web/src/lib/progress-outbox.ts');
const storage = new Map();
globalThis.localStorage = {
  get length() { return storage.size; },
  getItem: (k) => storage.get(k) ?? null,
  setItem: (k, value) => storage.set(k, value),
  removeItem: (k) => storage.delete(k),
  key: (index) => [...storage.keys()][index] ?? null,
};
globalThis.window = new EventTarget();

test('pending rounds survive reload, stay account-isolated and acknowledge only that round', async () => {
  storage.clear();
  const round = { stage: 1, mode: 'match', roundId: 'test-round-1', correctCount: 5 };
  queueRound('family-a', round);
  queueRound('family-a', { ...round, roundId: 'test-round-2', stage: 4 });
  queueRound('family-b', round);
  // Loading a fresh copy represents a reload with the same browser storage.
  const reloaded = await load('../../mandarin-garden-web/src/lib/progress-outbox.ts');
  assert.equal(reloaded.pendingRounds('family-a').length, 2);
  assert.equal(pendingRounds('family-b').length, 1);
  queueRound('family-a', round);
  assert.equal(pendingRounds('family-a').length, 2);
  acknowledgeRound('family-a', round.roundId);
  assert.equal(pendingRounds('family-a').length, 1);
  assert.equal(pendingRounds('family-b').length, 1);
});

test('per-question XP event IDs are stable for retries and distinct across questions', () => {
  const first = questionAwardId('game-round-123', 0);
  assert.equal(first, questionAwardId('game-round-123', 0));
  assert.notEqual(first, questionAwardId('game-round-123', 1));
  assert.throws(() => questionAwardId('game-round-123', -1), RangeError);
});

test('pending per-question XP awards remain distinct and idempotent in the outbox', () => {
  storage.clear();
  const answer0 = { stage: 2, mode: 'match', roundId: questionAwardId('game-round-123', 0), correctCount: 1 };
  const answer1 = { ...answer0, roundId: questionAwardId('game-round-123', 1) };
  queueRound('family-a', answer0);
  queueRound('family-a', answer1);
  queueRound('family-a', answer0);
  assert.deepEqual(pendingRounds('family-a'), [answer0, answer1]);
  acknowledgeRound('family-a', answer0.roundId);
  assert.deepEqual(pendingRounds('family-a'), [answer1]);
});

test('corrupt pending rounds fail explicitly instead of being discarded', () => {
  storage.set('mg-pending-round:family-c:bad-round', '{"stage":99}');
  assert.throws(() => pendingRounds('family-c'), /Invalid pending learning round/);
  assert.ok(storage.has('mg-pending-round:family-c:bad-round'));
});
