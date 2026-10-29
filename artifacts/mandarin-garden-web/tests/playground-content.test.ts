import assert from "node:assert/strict";
import test from "node:test";
import { stage1 } from "../src/lib/playground-content/stage-1";
import { stage2 } from "../src/lib/playground-content/stage-2";
import { stage3 } from "../src/lib/playground-content/stage-3";
import { stage4 } from "../src/lib/playground-content/stage-4";
import { buildRound } from "../src/lib/playground-games";

const stages = [stage1, stage2, stage3, stage4];
for (const stage of stages) {
  test(`stage ${stage.stage} has 200 distinct complete vocabulary entries and 10 original stories`, () => {
    assert.equal(stage.words.length, 200);
    assert.equal(new Set(stage.words.map((word) => word.trad)).size, 200);
    assert.equal(new Set(stage.words.map((word) => word.simp)).size, 200);
    for (const word of stage.words) {
      for (const field of ["trad", "simp", "pinyin", "en"] as const) assert.ok(word[field]?.trim(), `${word.id} missing ${field}`);
      assert.match(word.trad, /\p{Script=Han}/u);
      assert.doesNotMatch(word.en, /placeholder|TODO/i);
    }
    assert.equal(stage.stories.length, 10);
    assert.equal(new Set(stage.stories.map((story) => story.trad)).size, 10);
    for (const story of stage.stories) {
      assert.ok(story.trad.length >= 30 && story.simp.length >= 30, story.id);
      assert.ok(story.title.en && story.title.trad && story.title.simp);
    }
    assert.ok(stage.words.filter((word) => Array.from(word.trad).length >= 2).length >= 5, "Word reconstruction needs multi-character words");
    assert.ok(stage.sentences.length >= 5, "Sentence reconstruction needs a five-question round");
    for (const sentence of stage.sentences) {
      assert.ok(sentence.trad.length >= 2 && sentence.simp.length >= 2);
      assert.ok(sentence.en);
    }
  });
}
test("all stages have distinct banks, story IDs and word IDs", () => {
  const words = stages.flatMap((stage) => stage.words);
  const stories = stages.flatMap((stage) => stage.stories);
  assert.equal(words.length, 800);
  assert.equal(stories.length, 40);
  assert.equal(new Set(words.map((word) => word.id)).size, 800);
  assert.equal(new Set(stories.map((story) => story.id)).size, 40);
  assert.equal(new Set(stages.map((stage) => stage.words.map((word) => word.trad).join("|"))).size, 4);
});

test("every stage supports five valid game modes in both writing systems", () => {
  for (const stage of stages) {
    for (const mode of ["match", "pinyin", "listen", "word-order", "sentence-order"] as const) {
      for (const script of ["trad", "simp"] as const) {
        const questions = buildRound(stage.stage, mode, script);
        assert.equal(questions.length, 5, `${stage.stage}/${mode}/${script}`);
        for (const question of questions) {
          assert.ok(question.answer);
          if (question.kind === "choice") {
            assert.equal(question.options.length, 4);
            assert.equal(new Set(question.options).size, 4);
            assert.ok(question.options.includes(question.answer));
          } else {
            assert.ok(question.chunks.length >= 2);
            assert.equal(Array.from(question.chunks.join("")).sort().join(""), Array.from(question.answer).sort().join(""));
          }
        }
      }
    }
  }
});
