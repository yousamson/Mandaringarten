import { getStageContent, type VocabEntry } from './playground-content';
import type { GameMode } from './playground-copy';
import type { Script } from './speech';

export const QUESTIONS_PER_ROUND = 5;

export type ChoiceQuestion = {
  kind: 'choice';
  mode: 'match' | 'pinyin' | 'listen';
  prompt: string;
  speakText: string;
  answer: string;
  options: string[];
  word: VocabEntry;
};
export type OrderQuestion = {
  kind: 'order';
  mode: 'word-order' | 'sentence-order';
  answer: string;
  chunks: string[];
  clue: string;
  speakText: string;
};
export type Question = ChoiceQuestion | OrderQuestion;

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const hz = (w: VocabEntry, script: Script) => (script === 'simp' ? w.simp : w.trad);

function scramble(chunks: string[]): string[] {
  const answer = chunks.join('');
  for (let i = 0; i < 12; i++) {
    const s = shuffle(chunks);
    if (s.join('') !== answer) return s;
  }
  return [...chunks].reverse();
}

function choice(mode: ChoiceQuestion['mode'], word: VocabEntry, bank: VocabEntry[], script: Script): ChoiceQuestion {
  const display = (w: VocabEntry) => (mode === 'pinyin' ? w.pinyin : hz(w, script));
  const answer = display(word);
  const options = new Set<string>([answer]);
  for (const other of shuffle(bank)) {
    if (options.size >= 4) break;
    const value = display(other);
    // avoid near-identical meanings acting as a second correct answer
    if (mode === 'match' && other.en === word.en) continue;
    options.add(value);
  }
  return {
    kind: 'choice', mode, word, answer,
    prompt: mode === 'match' ? word.en : mode === 'pinyin' ? hz(word, script) : '',
    speakText: hz(word, script),
    options: shuffle([...options]),
  };
}

export function buildRound(stage: number, mode: GameMode, script: Script): Question[] {
  const content = getStageContent(stage);
  const bank = content.words;
  if (mode === 'sentence-order') {
    return shuffle(content.sentences).slice(0, QUESTIONS_PER_ROUND).map((s) => {
      const chunks = script === 'simp' ? s.simp : s.trad;
      return { kind: 'order', mode, answer: chunks.join(''), chunks: scramble(chunks), clue: s.en, speakText: chunks.join('') };
    });
  }
  if (mode === 'word-order') {
    const eligible = bank.filter((w) => {
      const chars = [...hz(w, script)];
      return chars.length >= 2 && new Set(chars).size > 1;
    });
    return shuffle(eligible).slice(0, QUESTIONS_PER_ROUND).map((w) => {
      const text = hz(w, script);
      return { kind: 'order', mode, answer: text, chunks: scramble([...text]), clue: `${w.en} · ${w.pinyin}`, speakText: text };
    });
  }
  return shuffle(bank).slice(0, QUESTIONS_PER_ROUND).map((w) => choice(mode, w, bank, script));
}

export function newRoundId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const PACK_SIZE = 20;
export const PACK_COUNT = 10;
export function packsForStage(stage: number) {
  const words = getStageContent(stage).words;
  return Array.from({ length: PACK_COUNT }, (_, i) => ({ index: i + 1, start: i * PACK_SIZE + 1, words: words.slice(i * PACK_SIZE, (i + 1) * PACK_SIZE) }));
}
