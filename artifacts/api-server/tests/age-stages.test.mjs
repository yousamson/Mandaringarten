import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const result = await build({
  entryPoints: [new URL('../../mandarin-garden-web/src/lib/age-stages.ts', import.meta.url).pathname],
  bundle: true, platform: 'node', format: 'esm', write: false,
});
const { ageStages, ageLabels, normalizeAgeStage, freeReadings } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`
);

test('age stages use the four requested ranges and preserve old saved stage ranks', () => {
  assert.deepEqual(ageStages, ['2-3', '4-5', '6-8', '9-12']);
  assert.equal(normalizeAgeStage('2-4'), '2-3');
  assert.equal(normalizeAgeStage('3-5'), '4-5');
  for (const age of ageStages) assert.equal(normalizeAgeStage(age), age);
  assert.equal(normalizeAgeStage(null), '2-3');
  assert.equal(normalizeAgeStage('unknown'), '2-3');
  assert.deepEqual(ageLabels('zh-Hant'), ['2至3歲', '4至5歲', '6至8歲', '9至12歲']);
});

test('every age has distinct localized free reading, increasing in length', () => {
  for (const language of ['en', 'zh-Hant', 'zh-Hans']) {
    const readings = ageStages.map((age) => freeReadings[age]);
    assert.equal(new Set(readings.map((reading) => reading.title[language])).size, 4);
    assert.equal(new Set(readings.map((reading) => reading.text[language])).size, 4);
    for (let i = 1; i < readings.length; i++) {
      assert(readings[i].text[language].length > readings[i - 1].text[language].length);
    }
  }
});
