import { hskLevels } from './hsk';
import { pscLevels } from './psc';
import type { ExamLevel, ExamTrack, ExamTrackId } from './types';

export type { ExamArticle, ExamLevel, ExamTrack, ExamTrackId, ExamWord } from './types';

export const examTracks: Record<ExamTrackId, ExamTrack> = {
  hsk: {
    id: 'hsk',
    name: 'HSK',
    shortName: 'HSK 3.0',
    subtitle: 'Chinese Proficiency Test · Levels 1–9',
    notice: 'Level names follow HSK 3.0. Words and readings here are original practice materials, not a complete official syllabus.',
    sourceLabel: 'Official HSK 3.0 syllabus',
    sourceUrl: 'https://www.chinesetest.cn/syllabus',
    levels: hskLevels,
  },
  psc: {
    id: 'psc',
    name: '普通話水平測試（PSC）',
    shortName: 'PSC',
    subtitle: 'Putonghua Proficiency Test · Three grades, six bands',
    notice: 'PSC assesses spoken Putonghua. These original word and reading exercises are level-oriented practice, not official test passages or a vocabulary syllabus.',
    sourceLabel: 'Official PSC outline',
    sourceUrl: 'https://www.moe.gov.cn/jyb_xxgk/gk_gbgg/moe_0/moe_9/moe_40/tnull_117.html',
    levels: pscLevels,
  },
};

export function getExamLevel(trackId: string, levelId: string): { track: ExamTrack; level: ExamLevel } | null {
  if (!(trackId in examTracks)) return null;
  const track = examTracks[trackId as ExamTrackId];
  const level = track.levels.find((item) => item.id === levelId);
  return level ? { track, level } : null;
}
