import assert from "node:assert/strict";
import test from "node:test";
import { playgroundStages } from "@workspace/learning-content";
import { buildRound, PACK_COUNT, PACK_SIZE, packsForStage } from "../src/lib/playground-games";
import { pathTheme } from "../src/lib/playground-copy";

const stages = playgroundStages;
const expectedPathThemes = [
  [
    "Numbers & family", "People, body & colours", "Colours, animals & fruit", "Fruit, food & actions",
    "Actions & describing words", "Toys, transport & home", "Nature, greetings & home",
    "Routines, play & transport", "People, feelings & care", "Describing & doing words",
  ],
  [
    "Meals & ingredients", "Fruit, places & weather", "Weather, feelings & shapes",
    "Transport, routines & questions", "Communication, play & creativity", "Nature, plants & animals",
    "Family, jobs & calendar", "Position, frequency & describing", "Comparisons, school & home items",
    "Clothes, questions & wellbeing",
  ],
  [
    "Nature, Earth & places", "Community & school", "Learning skills & choices",
    "Helping, travel & daily life", "Qualities & feelings", "Relationships, time & festivals",
    "Weather, nature & the body", "Health, people & media", "Arts, sport & travel",
    "Time, frequency & connecting ideas",
  ],
  [
    "Environment, society & technology", "Research, progress & aspirations",
    "Character, reasoning & expression", "Discussion, community & civic life",
    "Teams, literature & media", "Money, society & science", "Science, measurement & data",
    "Logic, connections & life skills", "Emotions, qualities & idioms", "Chinese idioms",
  ],
];

test("each stage has ten localized topic names for its 20-word paths", () => {
  const languages = ["en", "zh-Hant", "zh-Hans"] as const;
  for (let stage = 1; stage <= 4; stage++) {
    const packs = packsForStage(stage);
    assert.equal(packs.length, PACK_COUNT, `stage ${stage}`);
    assert.ok(packs.every((pack) => pack.words.length === PACK_SIZE), `stage ${stage} pack size`);
    assert.deepEqual(
      packs.map((pack) => pathTheme("en", stage, pack.index)),
      expectedPathThemes[stage - 1],
      `stage ${stage} English topics`,
    );
    for (const language of languages) {
      const themes = packs.map((pack) => pathTheme(language, stage, pack.index));
      assert.ok(themes.every((theme) => theme.trim()), `${stage}/${language} has a blank topic`);
      assert.equal(new Set(themes).size, PACK_COUNT, `${stage}/${language} has duplicate topics`);
    }
  }
});

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
