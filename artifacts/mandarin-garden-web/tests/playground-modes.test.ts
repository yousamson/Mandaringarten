import assert from 'node:assert/strict';
import test from 'node:test';
import { GAME_MODES, initialPlaygroundMode, playgroundModeHref } from '../src/lib/playground-modes.ts';

test('each home game link opens its matching mode immediately', () => {
  for (const mode of GAME_MODES) {
    const href = playgroundModeHref(mode);
    assert.equal(href, `/playground?mode=${mode}`);
    assert.equal(initialPlaygroundMode(new URL(href, 'https://garden.example').search), mode);
  }
});

test('unknown or missing game mode safely starts the default game', () => {
  assert.equal(initialPlaygroundMode(''), 'match');
  assert.equal(initialPlaygroundMode('?mode=unknown'), 'match');
});
