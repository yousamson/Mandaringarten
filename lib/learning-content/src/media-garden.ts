import type { PlaygroundLanguage } from './presentation';

export type FamilyMedia = {
  id: 'twinkle-star' | 'funny-faces';
  kind: 'audio' | 'video';
  title: Record<PlaygroundLanguage, string>;
  description: Record<PlaygroundLanguage, string>;
  creator: string;
  duration: string;
  mediaUrl: string;
  webMediaUrl?: string;
  sourceUrl: string;
  licenseUrl: string;
  license: Record<PlaygroundLanguage, string>;
  sourceName: string;
};

/** Externally hosted media; mount a player only after a family chooses an item. */
export const familyMedia: FamilyMedia[] = [
  {
    id: 'twinkle-star',
    kind: 'audio',
    title: {
      en: 'Twinkle, Twinkle, Little Star',
      'zh-Hant': '一閃一閃亮晶晶（清唱）',
      'zh-Hans': '一闪一闪亮晶晶（清唱）',
    },
    description: {
      en: 'A familiar English nursery song, sung a cappella.',
      'zh-Hant': '熟悉的英語兒歌清唱錄音。',
      'zh-Hans': '熟悉的英语儿歌清唱录音。',
    },
    creator: 'Dcoetzee',
    duration: '2:06',
    mediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/4/4f/Twinkle_Twinkle_Little_Star_-_sung_with_full_lyrics.ogg/Twinkle_Twinkle_Little_Star_-_sung_with_full_lyrics.ogg.mp3',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Twinkle_Twinkle_Little_Star_-_sung_with_full_lyrics.ogg',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/deed.en',
    license: {
      en: 'CC0 1.0 · Public Domain Dedication',
      'zh-Hant': 'CC0 1.0 · 公共領域貢獻',
      'zh-Hans': 'CC0 1.0 · 公共领域贡献',
    },
    sourceName: 'Wikimedia Commons',
  },
  {
    id: 'funny-faces',
    kind: 'video',
    title: {
      en: 'Humorous Phases of Funny Faces',
      'zh-Hant': '有趣的面孔',
      'zh-Hans': '有趣的面孔',
    },
    description: {
      en: 'A silent 1906 animation where a drawing comes to life. No sound.',
      'zh-Hant': '1906 年的默片動畫，畫上的面孔會動起來；沒有聲音。',
      'zh-Hans': '1906 年的默片动画，画上的面孔会动起来；没有声音。',
    },
    creator: 'J. Stuart Blackton',
    duration: '3:04',
    mediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/4/4f/Humorous_Phases_of_Funny_Faces.ogv/Humorous_Phases_of_Funny_Faces.ogv.360p.mpeg4.mov',
    webMediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/4/4f/Humorous_Phases_of_Funny_Faces.ogv/Humorous_Phases_of_Funny_Faces.ogv.240p.vp9.webm',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Humorous_Phases_of_Funny_Faces.ogv',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/deed.en',
    license: {
      en: 'Public Domain Mark 1.0',
      'zh-Hant': '公共領域標記 1.0',
      'zh-Hans': '公共领域标记 1.0',
    },
    sourceName: 'Wikimedia Commons',
  },
];
