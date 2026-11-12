export type ExamTrackId = 'hsk' | 'psc' | 'actfl' | 'tocfl';

export type ExamWord = {
  id: string;
  traditional: string;
  simplified: string;
  pinyin: string;
  meaning: string;
};

export type ExamArticle = {
  id: string;
  title: string;
  titleSimplified?: string;
  traditional: string;
  simplified: string;
};

export type ExamSentence = {
  id: string;
  traditional: string;
  simplified: string;
  answerWordId: string;
};

export type ExamLevel = {
  id: string;
  label: string;
  description: string;
  words: ExamWord[];
  article: ExamArticle;
  sentencePractice?: ExamSentence[];
};

export type ExamTrack = {
  id: ExamTrackId;
  name: string;
  shortName: string;
  subtitle: string;
  notice: string;
  sourceLabel: string;
  sourceUrl: string;
  levels: ExamLevel[];
};
