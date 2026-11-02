import type { VocabEntry } from '@workspace/learning-content';
import { toStage } from '@workspace/learning-content';
import { lessons, levels } from './garden-data';

const DAY_MS = 24 * 60 * 60 * 1000;
const freeTopics = lessons.filter((lesson) => !lesson.premium);

export type DailyChallengeQuestion = {
  prompt: VocabEntry;
  choices: VocabEntry[];
};

export function localDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayOrdinal(dayKey: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
    throw new RangeError(`Invalid daily challenge date: ${dayKey}`);
  }
  const timestamp = Date.parse(`${dayKey}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== dayKey) {
    throw new RangeError(`Invalid daily challenge date: ${dayKey}`);
  }
  return Math.floor(timestamp / DAY_MS);
}

/** Build a repeatable three-question round from the selected stage's daily topic. */
export function buildDailyChallenge(stageInput: number, dayKey = localDayKey()) {
  const stage = toStage(stageInput);
  const day = dayOrdinal(dayKey);
  const topicIndex = (day + stage - 1) % freeTopics.length;
  const topic = freeTopics[topicIndex];
  const stageWords = levels[stage - 1].words.map((row, index) => {
    const [trad, simp, pinyin, en] = row.split('|');
    return { id: `free-stage-${stage}-${index + 1}`, trad, simp, pinyin, en };
  });
  const topicWords: VocabEntry[] = topic.words.map((word) => ({
    id: word.id,
    trad: word.hanzi,
    simp: word.simplified,
    pinyin: word.pinyin,
    en: word.meaning.en,
  }));
  const seenTraditional = new Set<string>();
  const words = [...topicWords, ...stageWords].filter((word) => {
    if (seenTraditional.has(word.trad)) return false;
    seenTraditional.add(word.trad);
    return true;
  });

  if (words.length < 4) {
    throw new Error(`Daily challenge topic ${topic.id} for stage ${stage} needs at least four words.`);
  }

  const start = ((day % words.length) * 3 + stage) % words.length;
  const questions = Array.from({ length: 3 }, (_, questionIndex) => {
    const prompt = words[(start + questionIndex * 2) % words.length];
    const seenPinyin = new Set([prompt.pinyin]);
    const distractors: VocabEntry[] = [];

    for (let offset = 1; offset < words.length && distractors.length < 3; offset += 1) {
      const candidate = words[(words.indexOf(prompt) + offset) % words.length];
      if (seenPinyin.has(candidate.pinyin)) continue;
      seenPinyin.add(candidate.pinyin);
      distractors.push(candidate);
    }

    if (distractors.length < 3) {
      throw new Error(`Daily challenge topic ${topic.id} for stage ${stage} needs four distinct pinyin answers.`);
    }

    const choices = [prompt, ...distractors];
    const correctPosition = (day + questionIndex + stage) % choices.length;
    choices.splice(correctPosition, 0, choices.shift()!);
    return { prompt, choices };
  });

  return { stage, dayKey, topicIndex, theme: topic.title, questions };
}
