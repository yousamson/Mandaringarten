import type { Language } from './garden-data';

export const ageStages = ['2-3', '4-5', '6-8', '9-12'] as const;
export type AgeStage = typeof ageStages[number];

export function normalizeAgeStage(value: string | null): AgeStage {
  if (value === '2-4') return '2-3';
  if (value === '3-5') return '4-5';
  return ageStages.includes(value as AgeStage) ? value as AgeStage : '2-3';
}

export function ageLabels(language: Language): string[] {
  return ageStages.map((age) => {
    const [min, max] = age.split('-');
    return language === 'en' ? `Ages ${min}–${max}` : `${min}至${max}${language === 'zh-Hant' ? '歲' : '岁'}`;
  });
}

type Reading = { title: Record<Language, string>; text: Record<Language, string>; minutes: number };
export const freeReadings: Record<AgeStage, Reading> = {
  '2-3': {
    title: { en: 'My red ball', 'zh-Hant': '我的紅球', 'zh-Hans': '我的红球' },
    text: {
      en: 'Look, a red ball! I roll it. Mum catches it. We play together.',
      'zh-Hant': '看，紅球！我推一推。媽媽接住了。我們一起玩。',
      'zh-Hans': '看，红球！我推一推。妈妈接住了。我们一起玩。',
    }, minutes: 1,
  },
  '4-5': {
    title: { en: 'A little umbrella', 'zh-Hant': '小雨傘', 'zh-Hans': '小雨伞' },
    text: {
      en: 'It is raining. The kitten opens a yellow umbrella. A puppy comes over. “Come under my umbrella!” says the kitten. They walk home together, dry and happy.',
      'zh-Hant': '下雨了，小貓打開黃色的小雨傘。小狗走過來，小貓說：「一起撐傘吧！」牠們慢慢走回家，身上沒有淋濕，心裡暖暖的。',
      'zh-Hans': '下雨了，小猫打开黄色的小雨伞。小狗走过来，小猫说：“一起撑伞吧！”它们慢慢走回家，身上没有淋湿，心里暖暖的。',
    }, minutes: 1,
  },
  '6-8': {
    title: { en: 'The tiny school garden', 'zh-Hant': '校園小花圃', 'zh-Hans': '校园小花圃' },
    text: {
      en: 'After class, Ming and his friends care for the school garden. Ming waters the soil while his friends remove weeds. A week later, new leaves appear. They discover that working together helps the whole garden grow.',
      'zh-Hant': '下課後，小明和同學一起照顧校園的花圃。小明負責澆水，同學幫忙拔除雜草。過了一星期，泥土裡長出了嫩綠的新葉。大家發現，只要分工合作、耐心照顧，小小的花圃也能充滿生機。',
      'zh-Hans': '下课后，小明和同学一起照顾校园的花圃。小明负责浇水，同学帮忙拔除杂草。过了一星期，泥土里长出了嫩绿的新叶。大家发现，只要分工合作、耐心照顾，小小的花圃也能充满生机。',
    }, minutes: 2,
  },
  '9-12': {
    title: { en: 'A green corner for everyone', 'zh-Hant': '為公園留一片綠地', 'zh-Hans': '为公园留一片绿地' },
    text: {
      en: 'When the neighbourhood park was due for renovation, some residents wanted more parking spaces while others hoped to preserve the old trees. The children interviewed their neighbours and compared the different needs. They proposed keeping the trees, adding a safe footpath and placing parking near the entrance. Through discussion and compromise, the community found a plan that balanced convenience with care for the environment.',
      'zh-Hant': '附近公園準備改建時，有人希望增加停車空間，也有人想保留老樹。孩子們訪問居民，整理不同意見，再提出兼顧安全與綠地的方案：保留樹木、增設行人步道，並把停車位安排在入口附近。經過討論與協調，居民逐漸明白，公共空間的規劃不只是滿足個人需要，也要考慮環境與其他使用者的感受。',
      'zh-Hans': '附近公园准备改建时，有人希望增加停车空间，也有人想保留老树。孩子们访问居民，整理不同意见，再提出兼顾安全与绿地的方案：保留树木、增设行人步道，并把停车位安排在入口附近。经过讨论与协调，居民逐渐明白，公共空间的规划不只是满足个人需要，也要考虑环境与其他使用者的感受。',
    }, minutes: 3,
  },
};
