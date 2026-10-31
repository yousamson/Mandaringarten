import { stage1 } from './stage-1';
import { stage2 } from './stage-2';
import { stage3 } from './stage-3';
import { stage4 } from './stage-4';
import type { StageContent, StageNumber } from './types';

export type { StageContent, StageNumber, VocabEntry, StageSentence, StageStory } from './types';
export {
  ageLabels,
  ageStages,
  freeReadings,
  modeCopy,
  normalizeAgeStage,
  pathTheme,
  pickText,
  playgroundName,
  stageAges,
  stageLabel,
  stageNames,
  stageNotes,
} from './presentation';
export type { AgeStage, FreeReading, LocalizedText, PlaygroundLanguage } from './presentation';

export const playgroundStages: StageContent[] = [stage1, stage2, stage3, stage4];
export const STAGE_NUMBERS: StageNumber[] = [1, 2, 3, 4];

export function toStage(value: unknown): StageNumber {
  const n = Math.round(Number(value));
  return (n >= 1 && n <= 4 ? n : 1) as StageNumber;
}

export function getStageContent(stage: number): StageContent {
  return playgroundStages[toStage(stage) - 1];
}

/** Integrity report used by scripts/tests: counts and duplicate detection. */
export function validatePlaygroundContent() {
  const seen = new Map<string, number>();
  return playgroundStages.map((s) => {
    const trad = new Set(s.words.map((w) => w.trad));
    const crossStageDupes: string[] = [];
    s.words.forEach((w) => {
      const prev = seen.get(w.trad);
      if (prev && prev !== s.stage) crossStageDupes.push(w.trad);
      seen.set(w.trad, s.stage);
    });
    const malformed = s.words.filter((w) => !w.trad || !w.simp || !w.pinyin || !w.en || [...w.trad].length !== [...w.simp].length);
    return {
      stage: s.stage,
      words: s.words.length,
      distinctWords: trad.size,
      crossStageDupes,
      malformed: malformed.map((w) => w.trad),
      stories: s.stories.length,
      distinctStories: new Set(s.stories.map((st) => st.trad)).size,
      sentences: s.sentences.length,
      sentenceChunkMismatch: s.sentences.filter((x) => x.trad.length !== x.simp.length).length,
    };
  });
}
