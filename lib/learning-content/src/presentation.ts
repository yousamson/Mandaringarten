import type { GameMode } from './games';

export type PlaygroundLanguage = 'en' | 'zh-Hant' | 'zh-Hans';
export type AgeStage = '2-3' | '4-5' | '6-8' | '9-12';
export type LocalizedText = readonly [string, string, string];

export const ageStages: readonly AgeStage[] = ['2-3', '4-5', '6-8', '9-12'];

export function normalizeAgeStage(value: string | null): AgeStage {
  if (value === '2-4') return '2-3';
  if (value === '3-5') return '4-5';
  return ageStages.includes(value as AgeStage) ? value as AgeStage : '2-3';
}

export function ageLabels(language: PlaygroundLanguage): string[] {
  return ageStages.map((age) => {
    const [min, max] = age.split('-');
    return language === 'en'
      ? `Ages ${min}–${max}`
      : `${min}至${max}${language === 'zh-Hant' ? '歲' : '岁'}`;
  });
}

export type FreeReading = {
  title: Record<PlaygroundLanguage, string>;
  text: Record<PlaygroundLanguage, string>;
  minutes: number;
};

export const freeReadings: Record<AgeStage, FreeReading> = {
  '2-3': {
    title: { en: 'My red ball', 'zh-Hant': '我的紅球', 'zh-Hans': '我的红球' },
    text: {
      en: 'Look, a red ball! I roll it. Mum catches it. We play together.',
      'zh-Hant': '看，紅球！我推一推。媽媽接住了。我們一起玩。',
      'zh-Hans': '看，红球！我推一推。妈妈接住了。我们一起玩。',
    },
    minutes: 1,
  },
  '4-5': {
    title: { en: 'A little umbrella', 'zh-Hant': '小雨傘', 'zh-Hans': '小雨伞' },
    text: {
      en: 'It is raining. The kitten opens a yellow umbrella. A puppy comes over. “Come under my umbrella!” says the kitten. They walk home together, dry and happy.',
      'zh-Hant': '下雨了，小貓打開黃色的小雨傘。小狗走過來，小貓說：「一起撐傘吧！」牠們慢慢走回家，身上沒有淋濕，心裡暖暖的。',
      'zh-Hans': '下雨了，小猫打开黄色的小雨伞。小狗走过来，小猫说：“一起撑伞吧！”它们慢慢走回家，身上没有淋湿，心里暖暖的。',
    },
    minutes: 1,
  },
  '6-8': {
    title: { en: 'The tiny school garden', 'zh-Hant': '校園小花圃', 'zh-Hans': '校园小花圃' },
    text: {
      en: 'After class, Ming and his friends care for the school garden. Ming waters the soil while his friends remove weeds. A week later, new leaves appear. They discover that working together helps the whole garden grow.',
      'zh-Hant': '下課後，小明和同學一起照顧校園的花圃。小明負責澆水，同學幫忙拔除雜草。過了一星期，泥土裡長出了嫩綠的新葉。大家發現，只要分工合作、耐心照顧，小小的花圃也能充滿生機。',
      'zh-Hans': '下课后，小明和同学一起照顾校园的花圃。小明负责浇水，同学帮忙拔除杂草。过了一星期，泥土里长出了嫩绿的新叶。大家发现，只要分工合作、耐心照顾，小小的花圃也能充满生机。',
    },
    minutes: 2,
  },
  '9-12': {
    title: { en: 'A green corner for everyone', 'zh-Hant': '為公園留一片綠地', 'zh-Hans': '为公园留一片绿地' },
    text: {
      en: 'When the neighbourhood park was due for renovation, some residents wanted more parking spaces while others hoped to preserve the old trees. The children interviewed their neighbours and compared the different needs. They proposed keeping the trees, adding a safe footpath and placing parking near the entrance. Through discussion and compromise, the community found a plan that balanced convenience with care for the environment.',
      'zh-Hant': '附近公園準備改建時，有人希望增加停車空間，也有人想保留老樹。孩子們訪問居民，整理不同意見，再提出兼顧安全與綠地的方案：保留樹木、增設行人步道，並把停車位安排在入口附近。經過討論與協調，居民逐漸明白，公共空間的規劃不只是滿足個人需要，也要考慮環境與其他使用者的感受。',
      'zh-Hans': '附近公园准备改建时，有人希望增加停车空间，也有人想保留老树。孩子们访问居民，整理不同意见，再提出兼顾安全与绿地的方案：保留树木、增设行人步道，并把停车位安排在入口附近。经过讨论与协调，居民逐渐明白，公共空间的规划不只是满足个人需要，也要考虑环境与其他使用者的感受。',
    },
    minutes: 3,
  },
};

export const playgroundName: Record<PlaygroundLanguage, string> = {
  en: 'Learning playground',
  'zh-Hant': '學習樂園',
  'zh-Hans': '学习乐园',
};

export const stageNames: LocalizedText[] = [
  ['Seedling', '小芽學徒', '小芽学徒'],
  ['Word explorer', '詞語探險家', '词语探险家'],
  ['Sentence builder', '短句小能手', '短句小能手'],
  ['Little reader', '漢語小讀者', '汉语小读者'],
];

export const stageNotes: LocalizedText[] = [
  ['First words, colours, animals and everyday phrases', '第一批詞語、顏色、動物與生活用語', '第一批词语、颜色、动物与生活用语'],
  ['Places, feelings, routines and listening', '地點、心情、日常作息與聆聽', '地点、心情、日常作息与聆听'],
  ['School, community and connected sentences', '學校、社區與連貫短句', '学校、社区与连贯短句'],
  ['Ideas, idioms and longer reading', '抽象詞彙、成語與長篇閱讀', '抽象词汇、成语与长篇阅读'],
];

const wordPathThemes: LocalizedText[][] = [
  [
    ['Numbers & family', '數字與家人', '数字与家人'],
    ['People, body & colours', '人物、身體與顏色', '人物、身体与颜色'],
    ['Colours, animals & fruit', '顏色、動物與水果', '颜色、动物与水果'],
    ['Fruit, food & actions', '水果、食物與動作', '水果、食物与动作'],
    ['Actions & describing words', '動作與形容詞', '动作与形容词'],
    ['Toys, transport & home', '玩具、交通與居家物品', '玩具、交通与居家物品'],
    ['Nature, greetings & home', '自然、問候與居家用語', '自然、问候与居家用语'],
    ['Routines, play & transport', '日常作息、遊戲與交通', '日常作息、游戏与交通'],
    ['People, feelings & care', '人物、感受與照護', '人物、感受与照护'],
    ['Describing & doing words', '形容與行動', '形容与行动'],
  ],
  [
    ['Meals & ingredients', '三餐與食材', '三餐与食材'],
    ['Fruit, places & weather', '水果、場所與天氣', '水果、场所与天气'],
    ['Weather, feelings & shapes', '天氣、感受與形狀', '天气、感受与形状'],
    ['Transport, routines & questions', '交通、作息與提問', '交通、作息与提问'],
    ['Communication, play & creativity', '溝通、遊戲與創作', '沟通、游戏与创作'],
    ['Nature, plants & animals', '自然、植物與動物', '自然、植物与动物'],
    ['Family, jobs & calendar', '家人、職業與日曆', '家人、职业与日历'],
    ['Position, frequency & describing', '方位、頻率與描述', '方位、频率与描述'],
    ['Comparisons, school & home items', '比較、校園與居家物品', '比较、校园与居家物品'],
    ['Clothes, questions & wellbeing', '衣物、提問與健康', '衣物、提问与健康'],
  ],
  [
    ['Nature, Earth & places', '自然、地球與場所', '自然、地球与场所'],
    ['Community & school', '社區與校園', '社区与校园'],
    ['Learning skills & choices', '學習方法與選擇', '学习方法与选择'],
    ['Helping, travel & daily life', '助人、出行與日常生活', '助人、出行与日常生活'],
    ['Qualities & feelings', '特質與感受', '特质与感受'],
    ['Relationships, time & festivals', '人際、時間與節慶', '人际、时间与节庆'],
    ['Weather, nature & the body', '天氣、自然與身體', '天气、自然与身体'],
    ['Health, people & media', '健康、人物與媒體', '健康、人物与媒体'],
    ['Arts, sport & travel', '藝術、運動與旅行', '艺术、运动与旅行'],
    ['Time, frequency & connecting ideas', '時間、頻率與連接詞', '时间、频率与连接词'],
  ],
  [
    ['Environment, society & technology', '環境、社會與科技', '环境、社会与科技'],
    ['Research, progress & aspirations', '研究、進步與理想', '研究、进步与理想'],
    ['Character, reasoning & expression', '品格、思考與表達', '品格、思考与表达'],
    ['Discussion, community & civic life', '討論、社區與公民生活', '讨论、社区与公民生活'],
    ['Teams, literature & media', '團隊、文學與媒體', '团队、文学与媒体'],
    ['Money, society & science', '金錢、社會與科學', '金钱、社会与科学'],
    ['Science, measurement & data', '科學、測量與數據', '科学、测量与数据'],
    ['Logic, connections & life skills', '邏輯、連接與生活能力', '逻辑、连接与生活能力'],
    ['Emotions, qualities & idioms', '情緒、特質與成語', '情绪、特质与成语'],
    ['Chinese idioms', '成語', '成语'],
  ],
];

export function pickText(language: PlaygroundLanguage, text: LocalizedText): string {
  return language === 'en' ? text[0] : language === 'zh-Hant' ? text[1] : text[2];
}

export function pathTheme(language: PlaygroundLanguage, stage: number, packIndex: number): string {
  const stageThemes = wordPathThemes[Math.min(3, Math.max(0, Math.floor(stage) - 1))];
  const theme = stageThemes[Math.min(9, Math.max(0, Math.floor(packIndex) - 1))];
  return pickText(language, theme);
}

export const stageAges = ageStages.map((age) => age.replace('-', '–'));

export function stageLabel(language: PlaygroundLanguage, stage: number): string {
  return pickText(language, [
    `Stage ${stage}`,
    `第 ${stage} 階段`,
    `第 ${stage} 阶段`,
  ]);
}

export const modeCopy: Record<GameMode, { name: LocalizedText; hint: LocalizedText }> = {
  match: { name: ['Meaning match', '詞義配對', '词义配对'], hint: ['Read the meaning, find the word.', '看意思，找出詞語。', '看意思，找出词语。'] },
  pinyin: { name: ['Pinyin match', '拼音配對', '拼音配对'], hint: ['Pick the pinyin that fits the characters.', '選出和漢字相配的拼音。', '选出和汉字相配的拼音。'] },
  listen: { name: ['Listen and select', '聽音選字', '听音选字'], hint: ['Listen closely, then tap what you heard.', '仔細聽，再點選聽到的詞語。', '仔细听，再点选听到的词语。'] },
  'word-order': { name: ['Word builder', '漢字排排站', '汉字排排站'], hint: ['Tap the characters in the right order.', '依正確順序點選漢字。', '依正确顺序点选汉字。'] },
  'sentence-order': { name: ['Sentence builder', '句子拼拼看', '句子拼拼看'], hint: ['Put the sentence pieces back together.', '把句子片段重新排好。', '把句子片段重新排好。'] },
};
