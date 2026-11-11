import assert from "node:assert/strict";
import test from "node:test";
import {
  buildExamProgress,
  canAccessExamLevel,
  examLevelIds,
  isExamLevel,
} from "../src/exam-progress.ts";

const allActivities = ["meaning", "listening", "pinyin", "article"];
const completedHsk1 = [{ trackId: "hsk", levelId: "1", completedActivities: allActivities }];

test("a trial can open only the first level of each selected track", () => {
  const progress = buildExamProgress("trial", []);
  const hsk = progress.tracks.find((track) => track.trackId === "hsk").levels;
  const psc = progress.tracks.find((track) => track.trackId === "psc").levels;
  assert.equal(hsk[0].status, "available");
  assert.equal(hsk[1].status, "locked");
  assert.equal(psc[0].status, "available");
  assert.equal(psc[1].status, "locked");
  assert.equal(canAccessExamLevel("trial", completedHsk1, "hsk", "2"), false);
});

test("paid members unlock one level at a time after all four activities", () => {
  const initial = buildExamProgress("subscribed", []);
  const hsk = initial.tracks.find((track) => track.trackId === "hsk").levels;
  assert.equal(hsk[0].status, "available");
  assert.equal(hsk[1].status, "locked");

  const afterFirst = buildExamProgress("subscribed", completedHsk1);
  const levels = afterFirst.tracks.find((track) => track.trackId === "hsk").levels;
  assert.equal(levels[0].status, "completed");
  assert.equal(levels[0].completedCount, 4);
  assert.equal(levels[1].status, "available");
  assert.equal(levels[2].status, "locked");
  assert.equal(afterFirst.tracks.find((track) => track.trackId === "psc").levels[0].status, "available");
});

test("the next level stays locked until games and the article are all complete", () => {
  const partial = [{ trackId: "hsk", levelId: "1", completedActivities: ["meaning", "listening", "pinyin"] }];
  assert.equal(buildExamProgress("subscribed", partial).tracks[0].levels[1].status, "locked");
  const withArticle = [{ ...partial[0], completedActivities: [...partial[0].completedActivities, "article"] }];
  assert.equal(buildExamProgress("subscribed", withArticle).tracks[0].levels[1].status, "available");
});

test("administrators can review every level and unsubscribed accounts cannot open any", () => {
  const admin = buildExamProgress("admin", []);
  const noSubscription = buildExamProgress("none", []);
  assert.ok(admin.tracks.every((track) => track.levels.every((level) => level.status === "available")));
  assert.ok(noSubscription.tracks.every((track) => track.levels.every((level) => level.status === "locked")));
});

test("only listed HSK and PSC level IDs are accepted", () => {
  assert.deepEqual(examLevelIds.hsk, ["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  assert.deepEqual(examLevelIds.psc, ["3b", "3a", "2b", "2a", "1b", "1a"]);
  assert.equal(isExamLevel("psc", "3b"), true);
  assert.equal(isExamLevel("psc", "4a"), false);
  assert.equal(isExamLevel("other", "1"), false);
});
