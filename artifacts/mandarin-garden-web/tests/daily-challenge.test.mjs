import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

process.env.PORT ??= '24491';
process.env.BASE_PATH ??= '/';

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});
const { buildDailyChallenge, localDayKey } = await server.ssrLoadModule('/src/lib/daily-challenge.ts');
const { lessons } = await server.ssrLoadModule('/src/lib/garden-data.ts');
const freeWordIds = new Set(lessons.filter((lesson) => !lesson.premium).flatMap((lesson) => lesson.words.map((word) => word.id)));
after(async () => server.close());

test('daily challenge has three distinct questions and four unique pinyin answers', () => {
  for (let stage = 1; stage <= 4; stage += 1) {
    const challenge = buildDailyChallenge(stage, '2026-11-02');
    assert.equal(challenge.questions.length, 3);
    for (const question of challenge.questions) {
      assert.equal(question.choices.length, 4);
      assert.equal(new Set(question.choices.map((word) => word.pinyin)).size, 4);
      assert.ok(question.choices.some((word) => word.id === question.prompt.id));
    }
    assert.equal(new Set(challenge.questions.map((question) => question.prompt.id)).size, 3);
  }
});

test('daily challenge uses only existing free words, not the paid vocabulary banks', () => {
  for (let stage = 1; stage <= 4; stage += 1) {
    const challenge = buildDailyChallenge(stage, '2026-11-02');
    for (const question of challenge.questions) {
      for (const word of question.choices) {
        assert.ok(word.id.startsWith('free-stage-') || freeWordIds.has(word.id), `Unexpected paid word ${word.id}`);
      }
    }
  }
});

test('same stage and date gives the same challenge; the next day changes topic', () => {
  const first = buildDailyChallenge(2, '2026-11-02');
  const repeat = buildDailyChallenge(2, '2026-11-02');
  const tomorrow = buildDailyChallenge(2, '2026-11-03');
  assert.deepEqual(repeat, first);
  assert.notEqual(tomorrow.topicIndex, first.topicIndex);
});

test('local day key uses the supplied local calendar date', () => {
  assert.equal(localDayKey(new Date(2026, 10, 2, 23, 59)), '2026-11-02');
});

test('invalid date keys fail clearly', () => {
  assert.throws(() => buildDailyChallenge(1, '2026-02-30'), RangeError);
});
