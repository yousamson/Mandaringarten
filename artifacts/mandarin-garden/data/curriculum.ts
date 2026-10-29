export type CurriculumAge = '0-4' | '3-5' | '6-8' | '9-12';
export type ThemeId = 'daily' | 'family' | 'food' | 'leisure' | 'world';

export type CurriculumItem = {
  hanzi: string;
  simplified: string;
  pinyin: string;
  meaning: string;
};

export type Reading = {
  difficulty: 'easy' | 'intermediate' | 'hard';
  title: string;
  text: string;
};

export type CurriculumLevel = {
  age: CurriculumAge;
  level: number;
  formatKey: string;
  gameKeys: string[];
  themes: { id: ThemeId; items: CurriculumItem[] }[];
  readings?: Reading[];
};

export const curriculumLevels: CurriculumLevel[] = [
  {
    age: '0-4',
    level: 1,
    formatKey: 'curriculum.format1',
    gameKeys: ['curriculum.game.pictureMatch', 'curriculum.game.listenPoint'],
    themes: [
      { id: 'daily', items: [{ hanzi: '門', simplified: '门', pinyin: 'mén', meaning: 'door' }, { hanzi: '手', simplified: '手', pinyin: 'shǒu', meaning: 'hand' }] },
      { id: 'family', items: [{ hanzi: '媽媽', simplified: '妈妈', pinyin: 'mā ma', meaning: 'mum' }, { hanzi: '爸爸', simplified: '爸爸', pinyin: 'bà ba', meaning: 'dad' }] },
      { id: 'food', items: [{ hanzi: '水', simplified: '水', pinyin: 'shuǐ', meaning: 'water' }, { hanzi: '米飯', simplified: '米饭', pinyin: 'mǐ fàn', meaning: 'rice' }] },
      { id: 'leisure', items: [{ hanzi: '玩', simplified: '玩', pinyin: 'wán', meaning: 'play' }, { hanzi: '唱歌', simplified: '唱歌', pinyin: 'chàng gē', meaning: 'sing' }] },
      { id: 'world', items: [{ hanzi: '花', simplified: '花', pinyin: 'huā', meaning: 'flower' }, { hanzi: '狗', simplified: '狗', pinyin: 'gǒu', meaning: 'dog' }] },
    ],
  },
  {
    age: '3-5',
    level: 2,
    formatKey: 'curriculum.format2',
    gameKeys: ['curriculum.game.pinyinMatch', 'curriculum.game.phraseBuilder'],
    themes: [
      { id: 'daily', items: [{ hanzi: '刷牙', simplified: '刷牙', pinyin: 'shuā yá', meaning: 'brush teeth' }, { hanzi: '洗手', simplified: '洗手', pinyin: 'xǐ shǒu', meaning: 'wash hands' }] },
      { id: 'family', items: [{ hanzi: '姐姐', simplified: '姐姐', pinyin: 'jiě jie', meaning: 'older sister' }, { hanzi: '朋友', simplified: '朋友', pinyin: 'péng you', meaning: 'friend' }] },
      { id: 'food', items: [{ hanzi: '牛奶', simplified: '牛奶', pinyin: 'niú nǎi', meaning: 'milk' }, { hanzi: '點心', simplified: '点心', pinyin: 'diǎn xīn', meaning: 'snack' }] },
      { id: 'leisure', items: [{ hanzi: '跳舞', simplified: '跳舞', pinyin: 'tiào wǔ', meaning: 'dance' }, { hanzi: '踢球', simplified: '踢球', pinyin: 'tī qiú', meaning: 'play ball' }] },
      { id: 'world', items: [{ hanzi: '公園', simplified: '公园', pinyin: 'gōng yuán', meaning: 'park' }, { hanzi: '天氣', simplified: '天气', pinyin: 'tiān qì', meaning: 'weather' }] },
    ],
  },
  {
    age: '6-8',
    level: 3,
    formatKey: 'curriculum.format3',
    gameKeys: ['curriculum.game.idiomMatch', 'curriculum.game.sentenceOrder'],
    themes: [
      { id: 'daily', items: [{ hanzi: '整理', simplified: '整理', pinyin: 'zhěng lǐ', meaning: 'organize' }, { hanzi: '手忙腳亂', simplified: '手忙脚乱', pinyin: 'shǒu máng jiǎo luàn', meaning: 'in a flurry' }] },
      { id: 'family', items: [{ hanzi: '體貼', simplified: '体贴', pinyin: 'tǐ tiē', meaning: 'considerate' }, { hanzi: '互相幫助', simplified: '互相帮助', pinyin: 'hù xiāng bāng zhù', meaning: 'help one another' }] },
      { id: 'food', items: [{ hanzi: '營養', simplified: '营养', pinyin: 'yíng yǎng', meaning: 'nutrition' }, { hanzi: '五顏六色', simplified: '五颜六色', pinyin: 'wǔ yán liù sè', meaning: 'colorful' }] },
      { id: 'leisure', items: [{ hanzi: '觀察', simplified: '观察', pinyin: 'guān chá', meaning: 'observe' }, { hanzi: '全神貫注', simplified: '全神贯注', pinyin: 'quán shén guàn zhù', meaning: 'fully focused' }] },
      { id: 'world', items: [{ hanzi: '植物', simplified: '植物', pinyin: 'zhí wù', meaning: 'plant' }, { hanzi: '一心一意', simplified: '一心一意', pinyin: 'yī xīn yī yì', meaning: 'wholeheartedly' }] },
    ],
    readings: [
      { difficulty: 'easy', title: '校園小花圃', text: '下課後，小明和同學到花圃澆水。他們看見一朵紅花，開心得笑了。' },
      { difficulty: 'intermediate', title: '一起準備點心', text: '星期六，姐姐和弟弟一起準備水果點心。姐姐洗水果，弟弟把餐具放好。完成後，他們邀請家人一起分享。' },
      { difficulty: 'hard', title: '發現樹上的鳥巢', text: '散步時，樂樂在樹枝間發現一個鳥巢。他沒有伸手去碰，而是安靜地觀察，並提醒朋友保持距離，讓小鳥安心照顧幼鳥。' },
    ],
  },
  {
    age: '9-12',
    level: 4,
    formatKey: 'curriculum.format4',
    gameKeys: ['curriculum.game.idiomMatch', 'curriculum.game.sentenceOrder'],
    themes: [
      { id: 'daily', items: [{ hanzi: '規劃', simplified: '规划', pinyin: 'guī huà', meaning: 'plan' }, { hanzi: '井然有序', simplified: '井然有序', pinyin: 'jǐng rán yǒu xù', meaning: 'well organized' }] },
      { id: 'family', items: [{ hanzi: '溝通', simplified: '沟通', pinyin: 'gōu tōng', meaning: 'communicate' }, { hanzi: '設身處地', simplified: '设身处地', pinyin: 'shè shēn chǔ dì', meaning: 'put yourself in another’s place' }] },
      { id: 'food', items: [{ hanzi: '均衡', simplified: '均衡', pinyin: 'jūn héng', meaning: 'balanced' }, { hanzi: '津津有味', simplified: '津津有味', pinyin: 'jīn jīn yǒu wèi', meaning: 'with great enjoyment' }] },
      { id: 'leisure', items: [{ hanzi: '堅持', simplified: '坚持', pinyin: 'jiān chí', meaning: 'persist' }, { hanzi: '持之以恆', simplified: '持之以恒', pinyin: 'chí zhī yǐ héng', meaning: 'persevere' }] },
      { id: 'world', items: [{ hanzi: '環境', simplified: '环境', pinyin: 'huán jìng', meaning: 'environment' }, { hanzi: '未雨綢繆', simplified: '未雨绸缪', pinyin: 'wèi yǔ chóu móu', meaning: 'prepare ahead' }] },
    ],
    readings: [
      { difficulty: 'easy', title: '社區小花園', text: '社區裡有一座小花園。週末時，居民會一起整理花圃、清掃步道，讓大家都有舒服的休息空間。' },
      { difficulty: 'intermediate', title: '把時間安排好', text: '小安想參加足球練習，也要完成學校作業。他先列出每件事所需的時間，再和家人討論安排。因為計畫清楚，他有時間休息，也能準時完成任務。' },
      { difficulty: 'hard', title: '為公園留一片綠地', text: '附近公園準備改建時，有人希望增加停車空間，也有人想保留樹木。居民先蒐集資料，再提出兼顧安全與綠地的方案。經過多次討論，大家找到折衷方法，使公園既方便使用，也保有自然環境。' },
    ],
  },
];
