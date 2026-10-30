export type StageNumber = 1 | 2 | 3 | 4;
export type VocabEntry = { id: string; trad: string; simp: string; pinyin: string; en: string };
export type StageSentence = { trad: string[]; simp: string[]; en: string };
export type StageStory = { id: string; title: { en: string; trad: string; simp: string }; trad: string; simp: string };
export type StageContent = { stage: StageNumber; words: VocabEntry[]; sentences: StageSentence[]; stories: StageStory[] };

/** Row format: "Traditional|Simplified|pinyin|English" */
export function parseWords(stage: StageNumber, rows: string[]): VocabEntry[] {
  return rows.map((row, i) => {
    const [trad, simp, pinyin, en] = row.split('|');
    return { id: `s${stage}-w${i + 1}`, trad, simp, pinyin, en };
  });
}

/** Row format: "trad/chunks|simp/chunks|English" */
export function parseSentences(rows: string[]): StageSentence[] {
  return rows.map((row) => {
    const [trad, simp, en] = row.split('|');
    return { trad: trad.split('/'), simp: simp.split('/'), en };
  });
}

export function story(id: string, en: string, tradTitle: string, simpTitle: string, trad: string, simp: string): StageStory {
  return { id, title: { en, trad: tradTitle, simp: simpTitle }, trad, simp };
}
