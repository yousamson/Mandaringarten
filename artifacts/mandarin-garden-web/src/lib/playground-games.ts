import { getStageContent } from './playground-content';

export { buildRound, QUESTIONS_PER_ROUND, shuffle } from "@workspace/learning-content/games";
export type { ChoiceQuestion, OrderQuestion, Question, GameMode, Script, IssuedQuestion } from "@workspace/learning-content/games";

export const PACK_SIZE = 20;
export const PACK_COUNT = 10;
export function packsForStage(stage: number) {
  const words = getStageContent(stage).words;
  return Array.from({ length: PACK_COUNT }, (_, i) => ({ index: i + 1, start: i * PACK_SIZE + 1, words: words.slice(i * PACK_SIZE, (i + 1) * PACK_SIZE) }));
}
