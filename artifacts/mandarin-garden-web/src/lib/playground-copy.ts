import type { Language } from './garden-data';
import { cleanProductText } from './product-language';
import { GAME_MODES } from './playground-modes';
import type { GameMode } from './playground-modes';
import {
  modeCopy,
  pathTheme as sharedPathTheme,
  pickText,
  playgroundName as sharedPlaygroundName,
  stageAges,
  stageLabel as sharedStageLabel,
  stageNames,
  stageNotes,
} from '@workspace/learning-content';

export { GAME_MODES };
export type { GameMode };
export { modeCopy, stageAges, stageNames, stageNotes };

export const tr = (l: Language, en: string, hant: string, hans: string) =>
  cleanProductText(l === 'en' ? en : l === 'zh-Hant' ? hant : hans);
export const pick = (l: Language, v: readonly [string, string, string]) =>
  cleanProductText(pickText(l, v));

export const playgroundName: Record<Language, string> = sharedPlaygroundName;
export const pathTheme = (l: Language, stage: number, packIndex: number) =>
  cleanProductText(sharedPathTheme(l, stage, packIndex));
export const stageLabel = (l: Language, stage: number) =>
  cleanProductText(sharedStageLabel(l, stage));
