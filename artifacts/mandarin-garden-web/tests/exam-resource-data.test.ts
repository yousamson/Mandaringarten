import assert from 'node:assert/strict';
import test from 'node:test';
import { examTracks } from '../src/lib/exam-resources/index';

test('the four Chinese resource tracks expose their expected level counts', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(examTracks).map(([id, track]) => [id, track.levels.length])),
    { hsk: 9, psc: 6, actfl: 10, tocfl: 8 },
  );
});

test('every level has 20 distinct words and answerable sentence practice', () => {
  for (const track of Object.values(examTracks)) {
    for (const level of track.levels) {
      assert.equal(level.words.length, 20, `${track.id}/${level.id} word count`);
      assert.equal(new Set(level.words.map((word) => word.traditional)).size, 20, `${track.id}/${level.id} Traditional word duplicates`);
      assert.equal(new Set(level.words.map((word) => word.simplified)).size, 20, `${track.id}/${level.id} Simplified word duplicates`);
      assert.equal(level.sentencePractice?.length, 3, `${track.id}/${level.id} sentence count`);
      for (const sentence of level.sentencePractice ?? []) {
        assert.ok(sentence.traditional.includes('＿＿'), `${sentence.id} Traditional blank`);
        assert.ok(sentence.simplified.includes('＿＿'), `${sentence.id} Simplified blank`);
        assert.ok(level.words.some((word) => word.id === sentence.answerWordId), `${sentence.id} answer word exists`);
      }
    }
  }
});

test('reading texts grow with level and remain within 1,000 characters', () => {
  for (const track of Object.values(examTracks)) {
    let previousTraditionalLength = 0;
    let previousSimplifiedLength = 0;
    for (const level of track.levels) {
      const traditionalLength = [...level.article.traditional].length;
      const simplifiedLength = [...level.article.simplified].length;
      assert.ok(traditionalLength > previousTraditionalLength, `${track.id}/${level.id} Traditional reading grows`);
      assert.ok(simplifiedLength > previousSimplifiedLength, `${track.id}/${level.id} Simplified reading grows`);
      assert.ok(traditionalLength <= 1000, `${track.id}/${level.id} Traditional reading limit`);
      assert.ok(simplifiedLength <= 1000, `${track.id}/${level.id} Simplified reading limit`);
      previousTraditionalLength = traditionalLength;
      previousSimplifiedLength = simplifiedLength;
    }
  }
});
