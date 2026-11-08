import { getStageContent, type VocabEntry } from "./index";

export const QUESTIONS_PER_ROUND = 5;
export const FOCUS_CARDS_PER_STAGE = 15;
export const TOTAL_FOCUS_CARDS = FOCUS_CARDS_PER_STAGE * 4;
export type GameMode = "match" | "pinyin" | "listen" | "word-order" | "sentence-order" | "focus";
export type Script = "trad" | "simp";
export type FocusCard = {
  id: string;
  stage: number;
  target: VocabEntry;
};
export type ChoiceQuestion = {
  kind: "choice";
  mode: "match" | "pinyin" | "listen" | "focus";
  prompt: string;
  speakText: string;
  answer: string;
  options: string[];
  word: VocabEntry;
};
export type OrderQuestion = {
  kind: "order";
  mode: "word-order" | "sentence-order";
  answer: string;
  chunks: string[];
  clue: string;
  speakText: string;
};
export type Question = ChoiceQuestion | OrderQuestion;
export type IssuedQuestion = Question & { id: string };

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const hz = (word: VocabEntry, script: Script) => script === "simp" ? word.simp : word.trad;

export function getFocusCards(stage: number): FocusCard[] {
  const safeStage = Math.max(1, Math.min(4, Math.floor(stage)));
  return getStageContent(safeStage).words
    .slice(0, FOCUS_CARDS_PER_STAGE)
    .map((target, index) => ({
      id: `focus-${safeStage}-${index + 1}`,
      stage: safeStage,
      target,
    }));
}

export function focusRevealMilliseconds(stage: number): number {
  return [2600, 2200, 1800, 1400][Math.max(0, Math.min(3, Math.floor(stage) - 1))] ?? 1800;
}

function scramble(chunks: string[]): string[] {
  const answer = chunks.join("");
  for (let i = 0; i < 12; i++) {
    const shuffled = shuffle(chunks);
    if (shuffled.join("") !== answer) return shuffled;
  }
  return [...chunks].reverse();
}

function choice(mode: ChoiceQuestion["mode"], word: VocabEntry, bank: VocabEntry[], script: Script): ChoiceQuestion {
  const display = (entry: VocabEntry) => mode === "pinyin" ? entry.pinyin : hz(entry, script);
  const answer = display(word);
  const options = new Set<string>([answer]);
  for (const other of shuffle(bank)) {
    if (options.size >= 4) break;
    const value = display(other);
    if (mode === "match" && other.en === word.en) continue;
    options.add(value);
  }
  return {
    kind: "choice",
    mode,
    word,
    answer,
    prompt: mode === "match" ? word.en : mode === "pinyin" || mode === "focus" ? hz(word, script) : "",
    speakText: hz(word, script),
    options: shuffle([...options]),
  };
}

export function buildRound(stage: number, mode: GameMode, script: Script): Question[] {
  const content = getStageContent(stage);
  const bank = content.words;
  if (mode === "focus") {
    return shuffle(getFocusCards(stage))
      .slice(0, QUESTIONS_PER_ROUND)
      .map(({ target }) => choice(mode, target, bank, script));
  }
  if (mode === "sentence-order") {
    return shuffle(content.sentences).slice(0, QUESTIONS_PER_ROUND).map((sentence) => {
      const chunks = script === "simp" ? sentence.simp : sentence.trad;
      return { kind: "order", mode, answer: chunks.join(""), chunks: scramble(chunks), clue: sentence.en, speakText: chunks.join("") };
    });
  }
  if (mode === "word-order") {
    const eligible = bank.filter((word) => {
      const chars = [...hz(word, script)];
      return chars.length >= 2 && new Set(chars).size > 1;
    });
    return shuffle(eligible).slice(0, QUESTIONS_PER_ROUND).map((word) => {
      const text = hz(word, script);
      return { kind: "order", mode, answer: text, chunks: scramble([...text]), clue: `${word.en} · ${word.pinyin}`, speakText: text };
    });
  }
  return shuffle(bank).slice(0, QUESTIONS_PER_ROUND).map((word) => choice(mode, word, bank, script));
}
