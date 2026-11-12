import { hskLevels } from './hsk';
import { pscLevels } from './psc';
import { actflLevels } from './actfl';
import { tocflLevels } from './tocfl';
import { hskExtraWords, hskSentencePractice, pscExtraWords, pscSentencePractice } from './existing-expansion';
import {
  actflReadingChapters,
  hskReadingChapters,
  pscReadingChapters,
  tocflReadingChapters,
  withProgressiveReadings,
} from './progressive-readings';
import type { ExamLevel, ExamTrack, ExamTrackId } from './types';

export type { ExamArticle, ExamLevel, ExamSentence, ExamTrack, ExamTrackId, ExamWord } from './types';

function expandExistingLevels(
  levels: ExamLevel[],
  extraWords: Record<string, ExamLevel['words']>,
  sentencePractice: Record<string, NonNullable<ExamLevel['sentencePractice']>>,
) {
  return levels.map((level) => ({
    ...level,
    words: [...level.words, ...(extraWords[level.id] ?? [])],
    sentencePractice: sentencePractice[level.id] ?? [],
  }));
}

const hskProgression = withProgressiveReadings(
  expandExistingLevels(hskLevels, hskExtraWords, hskSentencePractice),
  hskReadingChapters,
);

// PSC grades run from 1A (highest) to 3B (lowest); learning progression starts at 3B.
const pscProgression = withProgressiveReadings(
  expandExistingLevels([...pscLevels].reverse(), pscExtraWords, pscSentencePractice),
  pscReadingChapters,
);
const actflProgression = withProgressiveReadings(actflLevels, actflReadingChapters);
const tocflProgression = withProgressiveReadings(tocflLevels, tocflReadingChapters);

export const examTracks: Record<ExamTrackId, ExamTrack> = {
  hsk: {
    id: 'hsk',
    name: 'HSK Resource Library',
    shortName: 'HSK 3.0',
    subtitle: 'Chinese Proficiency Test · Levels 1–9',
    notice: 'Level names follow HSK 3.0. Words and readings here are original practice materials, not a complete official syllabus.',
    sourceLabel: 'Official HSK 3.0 syllabus',
    sourceUrl: 'https://www.chinesetest.cn/syllabus',
    levels: hskProgression,
  },
  psc: {
    id: 'psc',
    name: '普通話水平測試（PSC）',
    shortName: 'PSC',
    subtitle: 'Putonghua Proficiency Test · Three grades, six bands',
    notice: 'PSC assesses spoken Putonghua. These original word and reading exercises are level-oriented practice, not official test passages or a vocabulary syllabus.',
    sourceLabel: 'Official PSC outline',
    sourceUrl: 'https://www.moe.gov.cn/jyb_xxgk/gk_gbgg/moe_0/moe_9/moe_40/tnull_117.html',
    levels: pscProgression,
  },
  actfl: {
    id: 'actfl',
    name: 'ACTFL Resource Library',
    shortName: 'ACTFL',
    subtitle: '10 practice steps grouped into four proficiency bands',
    notice: 'This site-designed sequence groups original Chinese practice into Novice, Intermediate, Advanced, and Superior bands. It is not an official ACTFL test, vocabulary list, or certification.',
    sourceLabel: 'ACTFL proficiency guidelines',
    sourceUrl: 'https://www.actfl.org/educator-resources/actfl-proficiency-guidelines',
    levels: actflProgression,
  },
  tocfl: {
    id: 'tocfl',
    name: 'TOCFL Resource Library',
    shortName: 'TOCFL',
    subtitle: '8 practice levels across four site-designed bands',
    notice: 'These original exercises use four locally designed practice bands with two steps each. The band labels and materials are not an official TOCFL syllabus or test.',
    sourceLabel: 'Official TOCFL website',
    sourceUrl: 'https://tocfl.edu.tw/',
    levels: tocflProgression,
  },
};

export function getExamLevel(trackId: string, levelId: string): { track: ExamTrack; level: ExamLevel } | null {
  if (!(trackId in examTracks)) return null;
  const track = examTracks[trackId as ExamTrackId];
  const level = track.levels.find((item) => item.id === levelId);
  return level ? { track, level } : null;
}
