import type { AgeStage } from '@workspace/learning-content';
export type ContentLanguage = 'en' | 'zh-Hant' | 'zh-Hans';

export type PictureBookPage = {
  art: string;
  trad: string;
  simp: string;
  pinyin: string;
  en: string;
  prompt: Record<ContentLanguage, string>;
};

export type PictureBook = {
  id: AgeStage;
  cover: string;
  title: Record<ContentLanguage, string>;
  subtitle: Record<ContentLanguage, string>;
  pages: PictureBookPage[];
};

export const parentChildBooks: PictureBook[] = [
  {
    id: '2-3',
    cover: '🌱',
    title: { en: 'The Little Seed', 'zh-Hant': '小芽找太陽', 'zh-Hans': '小芽找太阳' },
    subtitle: { en: 'A tiny seed looks for a warm place.', 'zh-Hant': '一顆小種子，尋找暖暖的陽光。', 'zh-Hans': '一颗小种子，寻找暖暖的阳光。' },
    pages: [
      { art: '🌰', trad: '小種子，睡在土裡。', simp: '小种子，睡在土里。', pinyin: 'Xiǎo zhǒngzi, shuì zài tǔ lǐ.', en: 'A little seed sleeps in the soil.', prompt: { en: 'Can you point to the seed?', 'zh-Hant': '你可以指一指種子嗎？', 'zh-Hans': '你可以指一指种子吗？' } },
      { art: '🌧️', trad: '雨水來了，種子喝水。', simp: '雨水来了，种子喝水。', pinyin: 'Yǔshuǐ lái le, zhǒngzi hē shuǐ.', en: 'The rain comes. The seed drinks.', prompt: { en: 'Can you make a soft rain sound?', 'zh-Hant': '我們一起輕輕做下雨聲，好嗎？', 'zh-Hans': '我们一起轻轻做下雨声，好吗？' } },
      { art: '🌱☀️', trad: '太陽出來，小芽笑了。', simp: '太阳出来，小芽笑了。', pinyin: 'Tàiyáng chūlái, xiǎo yá xiào le.', en: 'The sun comes out. The sprout smiles.', prompt: { en: 'What helps a plant grow?', 'zh-Hant': '植物長大需要什麼呢？', 'zh-Hans': '植物长大需要什么呢？' } },
    ],
  },
  {
    id: '4-5',
    cover: '🐻',
    title: { en: 'Bear’s Red Umbrella', 'zh-Hant': '小熊的紅雨傘', 'zh-Hans': '小熊的红雨伞' },
    subtitle: { en: 'A rainy walk becomes a kind adventure.', 'zh-Hant': '下雨天，小熊和朋友分享雨傘。', 'zh-Hans': '下雨天，小熊和朋友分享雨伞。' },
    pages: [
      { art: '🐻☂️', trad: '下雨了，小熊打開紅雨傘。', simp: '下雨了，小熊打开红雨伞。', pinyin: 'Xià yǔ le, xiǎo xióng dǎkāi hóng yǔsǎn.', en: 'It starts to rain. Bear opens a red umbrella.', prompt: { en: 'What color is Bear’s umbrella?', 'zh-Hant': '小熊的雨傘是什麼顏色？', 'zh-Hans': '小熊的雨伞是什么颜色？' } },
      { art: '🐰🌧️', trad: '小兔沒帶傘，小熊請牠一起走。', simp: '小兔没带伞，小熊请它一起走。', pinyin: 'Xiǎo tù méi dài sǎn, xiǎo xióng qǐng tā yìqǐ zǒu.', en: 'Rabbit has no umbrella. Bear invites Rabbit to walk together.', prompt: { en: 'How do you think Rabbit feels?', 'zh-Hant': '你猜小兔現在覺得怎樣？', 'zh-Hans': '你猜小兔现在觉得怎样？' } },
      { art: '🐻🐰🏡', trad: '雨停了，朋友一起回家。', simp: '雨停了，朋友一起回家。', pinyin: 'Yǔ tíng le, péngyou yìqǐ huí jiā.', en: 'The rain stops. The friends walk home together.', prompt: { en: 'When can we share with a friend?', 'zh-Hant': '什麼時候可以和朋友分享呢？', 'zh-Hans': '什么时候可以和朋友分享呢？' } },
    ],
  },
  {
    id: '6-8',
    cover: '🌙',
    title: { en: 'The Moon’s Letter', 'zh-Hant': '月亮郵差', 'zh-Hans': '月亮邮差' },
    subtitle: { en: 'A night-time letter travels across the garden.', 'zh-Hant': '一封夜晚的信，送到花園的每個角落。', 'zh-Hans': '一封夜晚的信，送到花园的每个角落。' },
    pages: [
      { art: '🌙✉️', trad: '月亮寫了一封信，請星星郵差送出。', simp: '月亮写了一封信，请星星邮差送出。', pinyin: 'Yuèliàng xiě le yì fēng xìn, qǐng xīngxing yóuchāi sòng chū.', en: 'The moon writes a letter and asks the star postman to deliver it.', prompt: { en: 'Who is carrying the letter?', 'zh-Hant': '誰帶著這封信去送呢？', 'zh-Hans': '谁带着这封信去送呢？' } },
      { art: '⭐🦉', trad: '星星先去找貓頭鷹，牠正在樹上看書。', simp: '星星先去找猫头鹰，它正在树上看书。', pinyin: 'Xīngxing xiān qù zhǎo māotóuyīng, tā zhèngzài shù shàng kàn shū.', en: 'The star visits Owl, who is reading in a tree.', prompt: { en: 'Where is Owl reading?', 'zh-Hant': '貓頭鷹在哪裡看書？', 'zh-Hans': '猫头鹰在哪里看书？' } },
      { art: '✉️🦔🌼', trad: '信送到了。小刺蝟讀完，笑著說：「晚安，月亮。」', simp: '信送到了。小刺猬读完，笑着说：“晚安，月亮。”', pinyin: 'Xìn sòng dào le. Xiǎo cìwei dú wán, xiào zhe shuō: “Wǎn’ān, yuèliàng.”', en: 'The letter arrives. After reading it, Hedgehog smiles: “Good night, Moon.”', prompt: { en: 'What might the moon have written?', 'zh-Hant': '你猜月亮在信裡寫了什麼？', 'zh-Hans': '你猜月亮在信里写了什么？' } },
    ],
  },
  {
    id: '9-12',
    cover: '🛶',
    title: { en: 'The Paper Boat Promise', 'zh-Hant': '河邊的紙船', 'zh-Hans': '河边的纸船' },
    subtitle: { en: 'Two friends learn that a small promise can travel far.', 'zh-Hant': '一艘紙船，載著兩位朋友的約定。', 'zh-Hans': '一艘纸船，载着两位朋友的约定。' },
    pages: [
      { art: '🧒📄', trad: '放學後，阿晴折了一艘紙船，寫上：「明天一起來看河邊的花。」', simp: '放学后，阿晴折了一艘纸船，写上：“明天一起来看河边的花。”', pinyin: 'Fàngxué hòu, Ā Qíng zhé le yì sōu zhǐchuán, xiě shàng: “Míngtiān yìqǐ lái kàn hébiān de huā.”', en: 'After school, Qing folds a paper boat and writes, “Let’s see the riverside flowers tomorrow.”', prompt: { en: 'What would you write on a paper boat?', 'zh-Hant': '如果是你，會在紙船上寫什麼？', 'zh-Hans': '如果是你，会在纸船上写什么？' } },
      { art: '🛶🌊', trad: '她把紙船放進淺淺的水流。紙船慢慢向前，停在一叢野花旁。', simp: '她把纸船放进浅浅的水流。纸船慢慢向前，停在一丛野花旁。', pinyin: 'Tā bǎ zhǐchuán fàng jìn qiǎnqiǎn de shuǐliú. Zhǐchuán mànmàn xiàng qián, tíng zài yì cóng yěhuā páng.', en: 'She sets it in the gentle stream. It drifts slowly and stops beside a patch of wildflowers.', prompt: { en: 'What makes a stream gentle or strong?', 'zh-Hant': '水流變快或變慢，可能和什麼有關？', 'zh-Hans': '水流变快或变慢，可能和什么有关？' } },
      { art: '🤝🌼', trad: '隔天，阿朗帶著花種來赴約。兩人一起種下花，也把紙船收好，留作下次見面的記號。', simp: '隔天，阿朗带着花种来赴约。两人一起种下花，也把纸船收好，留作下次见面的记号。', pinyin: 'Gétiān, Ā Lǎng dài zhe huāzhǒng lái fùyuē. Liǎng rén yìqǐ zhòng xià huā, yě bǎ zhǐchuán shōu hǎo, liú zuò xià cì jiànmiàn de jìhào.', en: 'The next day, Lang arrives with flower seeds. They plant them together and keep the boat as a reminder of their next visit.', prompt: { en: 'How did the two friends keep their promise?', 'zh-Hant': '兩位朋友怎樣做到約定的事？', 'zh-Hans': '两位朋友怎样做到约定的事？' } },
    ],
  },
];
