import type { AgeStage } from '@workspace/learning-content';

export type AgeBand = AgeStage;

export type Word = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  sentence: string;
  sentencePinyin: string;
  category: string;
  icon: string;
};

export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: string;
  premium: boolean;
  words: Word[];
};

export const ageBands: { value: AgeBand; labelKey: string; noteKey: string }[] = [
  { value: '2-3', labelKey: 'age.2-3.label', noteKey: 'age.2-3.note' },
  { value: '4-5', labelKey: 'age.4-5.label', noteKey: 'age.4-5.note' },
  { value: '6-8', labelKey: 'age.6-8.label', noteKey: 'age.6-8.note' },
  { value: '9-12', labelKey: 'age.9-12.label', noteKey: 'age.9-12.note' },
];

export const lessons: Lesson[] = [
  {
    id: 'greetings',
    title: '打招呼',
    subtitle: '認識新朋友',
    category: 'daily',
    icon: 'chatbubble-ellipses-outline',
    premium: false,
    words: [
      {
        id: 'ni-hao',
        hanzi: '你好',
        pinyin: 'nǐ hǎo',
        meaning: 'Hello',
        sentence: '你好，我叫小樂。',
        sentencePinyin: 'nǐ hǎo, wǒ jiào xiǎo lè.',
        category: '打招呼',
        icon: 'hand-left-outline',
      },
      {
        id: 'zao-shang-hao',
        hanzi: '早上好',
        pinyin: 'zǎo shàng hǎo',
        meaning: 'Good morning',
        sentence: '早上好，我們一起出門吧。',
        sentencePinyin: 'zǎo shàng hǎo, wǒ men yì qǐ chū mén ba.',
        category: '打招呼',
        icon: 'sunny-outline',
      },
      {
        id: 'xie-xie',
        hanzi: '謝謝',
        pinyin: 'xiè xie',
        meaning: 'Thank you',
        sentence: '謝謝你幫我。',
        sentencePinyin: 'xiè xie nǐ bāng wǒ.',
        category: '打招呼',
        icon: 'heart-outline',
      },
      {
        id: 'zai-jian',
        hanzi: '再見',
        pinyin: 'zài jiàn',
        meaning: 'Goodbye',
        sentence: '再見，明天見！',
        sentencePinyin: 'zài jiàn, míng tiān jiàn.',
        category: '打招呼',
        icon: 'walk-outline',
      },
    ],
  },
  {
    id: 'fruit',
    title: '好吃水果',
    subtitle: '看看顏色和味道',
    category: 'food',
    icon: 'nutrition-outline',
    premium: false,
    words: [
      {
        id: 'ping-guo',
        hanzi: '蘋果',
        pinyin: 'píng guǒ',
        meaning: 'Apple',
        sentence: '我想吃一個蘋果。',
        sentencePinyin: 'wǒ xiǎng chī yí ge píng guǒ.',
        category: '水果',
        icon: 'nutrition-outline',
      },
      {
        id: 'xiang-jiao',
        hanzi: '香蕉',
        pinyin: 'xiāng jiāo',
        meaning: 'Banana',
        sentence: '香蕉是黃色的。',
        sentencePinyin: 'xiāng jiāo shì huáng sè de.',
        category: '水果',
        icon: 'leaf-outline',
      },
      {
        id: 'shui',
        hanzi: '水',
        pinyin: 'shuǐ',
        meaning: 'Water',
        sentence: '請給我一杯水。',
        sentencePinyin: 'qǐng gěi wǒ yì bēi shuǐ.',
        category: '吃喝',
        icon: 'water-outline',
      },
      {
        id: 'mi-fan',
        hanzi: '米飯',
        pinyin: 'mǐ fàn',
        meaning: 'Rice',
        sentence: '我們一起吃米飯。',
        sentencePinyin: 'wǒ men yì qǐ chī mǐ fàn.',
        category: '吃喝',
        icon: 'restaurant-outline',
      },
    ],
  },
  {
    id: 'animals',
    title: '可愛動物',
    subtitle: '牠們住在哪裡？',
    category: 'world',
    icon: 'paw-outline',
    premium: true,
    words: [
      {
        id: 'mao',
        hanzi: '貓',
        pinyin: 'māo',
        meaning: 'Cat',
        sentence: '小貓在窗邊睡覺。',
        sentencePinyin: 'xiǎo māo zài chuāng biān shuì jiào.',
        category: '動物',
        icon: 'paw-outline',
      },
      {
        id: 'gou',
        hanzi: '狗',
        pinyin: 'gǒu',
        meaning: 'Dog',
        sentence: '小狗喜歡散步。',
        sentencePinyin: 'xiǎo gǒu xǐ huan sàn bù.',
        category: '動物',
        icon: 'paw-outline',
      },
      {
        id: 'niao',
        hanzi: '鳥',
        pinyin: 'niǎo',
        meaning: 'Bird',
        sentence: '小鳥在樹上唱歌。',
        sentencePinyin: 'xiǎo niǎo zài shù shàng chàng gē.',
        category: '動物',
        icon: 'leaf-outline',
      },
      {
        id: 'yu',
        hanzi: '魚',
        pinyin: 'yú',
        meaning: 'Fish',
        sentence: '魚兒在水裡游。',
        sentencePinyin: 'yú ér zài shuǐ lǐ yóu.',
        category: '動物',
        icon: 'water-outline',
      },
    ],
  },
  {
    id: 'family',
    title: '我的家人',
    subtitle: '介紹最親近的人',
    category: 'family',
    icon: 'people-outline',
    premium: true,
    words: [
      {
        id: 'mama',
        hanzi: '媽媽',
        pinyin: 'mā ma',
        meaning: 'Mum',
        sentence: '媽媽陪我看書。',
        sentencePinyin: 'mā ma péi wǒ kàn shū.',
        category: '家人朋友',
        icon: 'heart-outline',
      },
      {
        id: 'baba',
        hanzi: '爸爸',
        pinyin: 'bà ba',
        meaning: 'Dad',
        sentence: '爸爸和我去公園。',
        sentencePinyin: 'bà ba hé wǒ qù gōng yuán.',
        category: '家人朋友',
        icon: 'people-outline',
      },
      {
        id: 'peng-you',
        hanzi: '朋友',
        pinyin: 'péng you',
        meaning: 'Friend',
        sentence: '我們是好朋友。',
        sentencePinyin: 'wǒ men shì hǎo péng you.',
        category: '家人朋友',
        icon: 'people-outline',
      },
      {
        id: 'jia',
        hanzi: '家',
        pinyin: 'jiā',
        meaning: 'Home',
        sentence: '我喜歡我的家。',
        sentencePinyin: 'wǒ xǐ huan wǒ de jiā.',
        category: '家人朋友',
        icon: 'home-outline',
      },
    ],
  },
  {
    id: 'outside',
    title: '出門去看看',
    subtitle: '街上有什麼？',
    category: 'daily',
    icon: 'compass-outline',
    premium: true,
    words: [
      {
        id: 'che',
        hanzi: '車',
        pinyin: 'chē',
        meaning: 'Car',
        sentence: '我們坐車去公園。',
        sentencePinyin: 'wǒ men zuò chē qù gōng yuán.',
        category: '出行',
        icon: 'car-outline',
      },
      {
        id: 'gong-yuan',
        hanzi: '公園',
        pinyin: 'gōng yuán',
        meaning: 'Park',
        sentence: '公園裡有很多樹。',
        sentencePinyin: 'gōng yuán lǐ yǒu hěn duō shù.',
        category: '出行',
        icon: 'leaf-outline',
      },
      {
        id: 'shu',
        hanzi: '樹',
        pinyin: 'shù',
        meaning: 'Tree',
        sentence: '大樹下很涼快。',
        sentencePinyin: 'dà shù xià hěn liáng kuai.',
        category: '身邊世界',
        icon: 'leaf-outline',
      },
      {
        id: 'shu-bao',
        hanzi: '書包',
        pinyin: 'shū bāo',
        meaning: 'Schoolbag',
        sentence: '我把書放進書包。',
        sentencePinyin: 'wǒ bǎ shū fàng jìn shū bāo.',
        category: '日常生活',
        icon: 'briefcase-outline',
      },
    ],
  },
];

export const allWords = lessons.flatMap((lesson) => lesson.words);

export function ageBandNote(ageBand: AgeBand): string {
  return ageBands.find((band) => band.value === ageBand)?.noteKey ?? 'age.2-3.note';
}
