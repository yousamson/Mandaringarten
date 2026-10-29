import type { Language } from './garden-data';
import { ageStages } from './age-stages';
import { cleanProductText } from './product-language';

export const tr = (l: Language, en: string, hant: string, hans: string) => cleanProductText(l === 'en' ? en : l === 'zh-Hant' ? hant : hans);
export const pick = (l: Language, v: readonly [string, string, string]) => tr(l, v[0], v[1], v[2]);

export const playgroundName: Record<Language, string> = { en: 'Learning playground', 'zh-Hant': '學習樂園', 'zh-Hans': '学习乐园' };

export const stageNames: [string, string, string][] = [
  ['Seedling', '小芽學徒', '小芽学徒'],
  ['Word explorer', '詞語探險家', '词语探险家'],
  ['Sentence builder', '短句小能手', '短句小能手'],
  ['Little reader', '漢語小讀者', '汉语小读者'],
];
const wordPathThemes: [string, string, string][][] = [
  [
    ['Numbers & counting', '數字與數量', '数字与数量'],
    ['People, body & colours', '人物、身體與顏色', '人物、身体与颜色'],
    ['Animal neighbours', '身邊的動物', '身边的动物'],
    ['Fruit & food', '水果與食物', '水果与食物'],
    ['Everyday actions', '日常動作', '日常动作'],
    ['Things around us', '生活物件', '生活物件'],
    ['Sky & weather', '天空與天氣', '天空与天气'],
    ['Places & directions', '方位與時間', '方位与时间'],
    ['Home & self-care', '居家與個人照護', '居家与个人照护'],
    ['Describing words', '形容詞與感受', '形容词与感受'],
  ],
  [
    ['Meals & ingredients', '三餐與食物', '三餐与食物'],
    ['Places around us', '身邊的場所', '身边的场所'],
    ['Weather & seasons', '天氣、季節與心情', '天气、季节与心情'],
    ['Shapes & transport', '形狀與交通', '形状与交通'],
    ['Thoughts & expression', '想法與表達', '想法与表达'],
    ['Nature outdoors', '自然景物', '自然景物'],
    ['Family & community helpers', '家人與社區職業', '家人与社区职业'],
    ['Position & degree', '方位與程度', '方位与程度'],
    ['Time & distance', '時間與遠近', '时间与远近'],
    ['Clothes & personal items', '衣物與隨身物品', '衣物与随身物品'],
  ],
  [
    ['Daily life & nature', '生活與自然', '生活与自然'],
    ['Community places', '社區場所', '社区场所'],
    ['Learning at school', '校園學習', '校园学习'],
    ['Communication & sharing', '溝通與分享', '沟通与分享'],
    ['Qualities & choices', '特點與判斷', '特点与判断'],
    ['Feelings & relationships', '情感與人際', '情感与人际'],
    ['Festivals & weather', '節慶與天氣', '节庆与天气'],
    ['Health & the body', '健康與身體', '健康与身体'],
    ['Reading, music & sport', '閱讀、音樂與運動', '阅读、音乐与运动'],
    ['Time & frequency', '時間與頻率', '时间与频率'],
  ],
  [
    ['Environment & the future', '環境與未來', '环境与未来'],
    ['Science & research', '科學與研究', '科学与研究'],
    ['Character & values', '品格與價值', '品格与价值'],
    ['Expression & discussion', '表達與討論', '表达与讨论'],
    ['Teams & roles', '團隊與角色', '团队与角色'],
    ['Technology & resources', '科技與資源', '科技与资源'],
    ['Natural science', '自然科學', '自然科学'],
    ['Logic & connections', '邏輯與連接詞', '逻辑与连接词'],
    ['Emotions & character', '情緒與品格', '情绪与品格'],
    ['Chinese idioms', '成語故事', '成语故事'],
  ],
];
export const pathTheme = (l: Language, stage: number, packIndex: number) => {
  const stageThemes = wordPathThemes[Math.min(3, Math.max(0, Math.floor(stage) - 1))];
  const theme = stageThemes[Math.min(9, Math.max(0, Math.floor(packIndex) - 1))];
  return pick(l, theme);
};
export const stageAges = ageStages.map((age) => age.replace('-', '–'));
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
