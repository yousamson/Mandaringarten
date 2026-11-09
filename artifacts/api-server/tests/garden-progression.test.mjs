import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceGardenCare,
  getGardenStatus,
  GARDEN_CARE_XP_COST,
  GARDEN_BLOOM_DAYS,
  GARDEN_FULL_GROWTH_DAYS,
} from '../../../lib/learning-content/src/progression.ts';

const date = (offset) => new Date(Date.UTC(2026, 0, 1 + offset)).toISOString().slice(0, 10);
const seed = { growthDays: 0, streakDays: 0, lastCareDate: null, lastCareType: null };

test('garden care spends the selected-stage XP threshold and is daily', () => {
  assert.equal(getGardenStatus(seed, date(0), 19).xpNeeded, 1);
  assert.equal(getGardenStatus(seed, date(0), 20).careAvailable, true);
  assert.equal(GARDEN_CARE_XP_COST, 20);
});

test('ten consecutive care days produce the first bloom and thirty produce a full garden', () => {
  let garden = seed;
  for (let day = 0; day < GARDEN_FULL_GROWTH_DAYS; day += 1) {
    garden = advanceGardenCare(garden, day % 2 ? 'fertilize' : 'water', date(day));
  }
  assert.equal(garden.streakDays, 30);
  assert.equal(garden.growthDays, GARDEN_FULL_GROWTH_DAYS);
  assert.equal(getGardenStatus(garden, date(29), 20).caredToday, true);
  assert.equal(GARDEN_BLOOM_DAYS, 10);
});

test('missed days break the streak, gradually shrink the flowers, then return to seed', () => {
  let garden = seed;
  for (let day = 0; day < 10; day += 1) garden = advanceGardenCare(garden, 'water', date(day));

  assert.equal(getGardenStatus(garden, date(13), 20).growthDays, 10, 'up to four missed days preserve the garden');
  assert.equal(getGardenStatus(garden, date(14), 20).growthDays, 9, 'the fifth missed day shrinks one growth step');
  assert.equal(getGardenStatus(garden, date(39), 20).growthDays, 0, 'thirty days without care returns to seed');

  const resumed = advanceGardenCare(garden, 'fertilize', date(14));
  assert.equal(resumed.streakDays, 1, 'resuming after a gap starts a new consecutive streak');
  assert.equal(resumed.growthDays, 9, 'resuming preserves the remaining garden growth');
});

test('second care on the same day is rejected', () => {
  const cared = advanceGardenCare(seed, 'water', date(0));
  assert.throws(() => advanceGardenCare(cared, 'fertilize', date(0)), /already been cared/);
});
