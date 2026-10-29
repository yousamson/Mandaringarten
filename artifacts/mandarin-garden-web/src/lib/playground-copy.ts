import type { Language } from './garden-data';

export const tr = (l: Language, en: string, hant: string, hans: string) => (l === 'en' ? en : l === 'zh-Hant' ? hant : hans);
export const pick = (l: Language, v: readonly [string, string, string]) => tr(l, v[0], v[1], v[2]);

export const playgroundName: Record<Language, string> = { en: 'Learning playground', 'zh-Hant': '學習樂園', 'zh-Hans': '学习乐园' };

export const stageNames: [string, string, string][] = [
  ['Seedling', '小芽學徒', '小芽学徒'],
  ['Word explorer', '詞語探險家', '词语探险家'],
  ['Sentence builder', '短句小能手', '短句小能手'],
  ['Little reader', '漢語小讀者', '汉语小读者'],
];
export const stageAges = ['2–4', '3–5', '6–8', '9–12'];
export const stageNotes: [string, string, string][] = [
  ['First words, colours, animals and everyday phrases', '第一批詞語、顏色、動物與生活用語', '第一批词语、颜色、动物与生活用语'],
  ['Places, feelings, routines and listening', '地點、心情、日常作息與聆聽', '地点、心情、日常作息与聆听'],
  ['School, community and connected sentences', '學校、社區與連貫短句', '学校、社区与连贯短句'],
  ['Ideas, idioms and longer reading', '抽象詞彙、成語與長篇閱讀', '抽象词汇、成语与长篇阅读'],
];
export const stageLabel = (l: Language, stage: number) => tr(l, `Stage ${stage}`, `第 ${stage} 階段`, `第 ${stage} 阶段`);

export type GameMode = 'match' | 'pinyin' | 'listen' | 'word-order' | 'sentence-order';
export const GAME_MODES: GameMode[] = ['match', 'pinyin', 'listen', 'word-order', 'sentence-order'];
export const modeCopy: Record<GameMode, { name: [string, string, string]; hint: [string, string, string] }> = {
  match: { name: ['Meaning match', '詞義配對', '词义配对'], hint: ['Read the meaning, find the word.', '看意思，找出詞語。', '看意思，找出词语。'] },
  pinyin: { name: ['Pinyin match', '拼音配對', '拼音配对'], hint: ['Pick the pinyin that fits the characters.', '選出和漢字相配的拼音。', '选出和汉字相配的拼音。'] },
  listen: { name: ['Listen and select', '聽音選字', '听音选字'], hint: ['Listen closely, then tap what you heard.', '仔細聽，再點選聽到的詞語。', '仔细听，再点选听到的词语。'] },
  'word-order': { name: ['Word builder', '漢字排排站', '汉字排排站'], hint: ['Tap the characters in the right order.', '依正確順序點選漢字。', '依正确顺序点选汉字。'] },
  'sentence-order': { name: ['Sentence builder', '句子拼拼看', '句子拼拼看'], hint: ['Put the sentence pieces back together.', '把句子片段重新排好。', '把句子片段重新排好。'] },
};
