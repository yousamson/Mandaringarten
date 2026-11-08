import type { GameMode as ContentGameMode } from '@workspace/learning-content/games';

export const GAME_MODES = ['match', 'pinyin', 'listen', 'word-order', 'sentence-order', 'focus'] as const satisfies readonly ContentGameMode[];
export type GameMode = typeof GAME_MODES[number];

export function initialPlaygroundMode(search: string): GameMode {
  const requested = new URLSearchParams(search).get('mode');
  return GAME_MODES.includes(requested as GameMode) ? requested as GameMode : 'match';
}

export function playgroundModeHref(mode: GameMode): string {
  return `/playground?mode=${encodeURIComponent(mode)}`;
}
