import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AgeBand } from '@/data/vocabulary';

const STORAGE_KEY = 'mandarin-garden-learning-v1';
export const XP_PER_CORRECT = 5;

type LearningState = {
  ageBand: AgeBand;
  xp: number;
  curriculumXp: number;
  streak: number;
  learnedWordIds: string[];
  completedLessonIds: string[];
  gamesPlayed: number;
  lastActiveDate: string | null;
};

type LearningContextValue = LearningState & {
  hydrated: boolean;
  level: number;
  nextLevelXp: number;
  setAgeBand: (ageBand: AgeBand) => void;
  awardCorrectAnswer: (countsForCurriculum?: boolean) => void;
  markWordLearned: (wordId: string) => void;
  completeLesson: (lessonId: string) => void;
  recordGame: () => void;
};

const initialState: LearningState = {
  ageBand: '2-4',
  xp: 0,
  curriculumXp: 0,
  streak: 0,
  learnedWordIds: [],
  completedLessonIds: [],
  gamesPlayed: 0,
  lastActiveDate: null,
};

const LearningContext = createContext<LearningContextValue | null>(null);

function localDateKey(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function yesterdayKey(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function withActivity(
  state: LearningState,
  xp: number,
  curriculumXp: number = xp,
): LearningState {
  const today = localDateKey();
  if (state.lastActiveDate === today) {
    return { ...state, xp: state.xp + xp, curriculumXp: state.curriculumXp + curriculumXp };
  }
  const streak =
    state.lastActiveDate === yesterdayKey() ? state.streak + 1 : 1;
  return { ...state, xp: state.xp + xp, curriculumXp: state.curriculumXp + curriculumXp, streak, lastActiveDate: today };
}

export function LearningProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<LearningState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        if (stored) {
          const parsed = JSON.parse(stored) as Record<string, unknown>;
          const savedAgeBand =
            parsed.ageBand === '0-2' || parsed.ageBand === '0-4'
              ? '2-4'
              : parsed.ageBand;
          setState({
            ...initialState,
            ...parsed,
            ageBand: (savedAgeBand as AgeBand) ?? initialState.ageBand,
          });
        }
      })
      .catch(() => {
        if (active) setState(initialState);
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      // Keep the in-memory session usable if device storage is temporarily unavailable.
    });
  }, [hydrated, state]);

  const setAgeBand = useCallback((ageBand: AgeBand) => {
    setState((current) => ({ ...current, ageBand }));
  }, []);

  const markWordLearned = useCallback((wordId: string) => {
    setState((current) => {
      if (current.learnedWordIds.includes(wordId)) return current;
      return withActivity(
        {
          ...current,
          learnedWordIds: [...current.learnedWordIds, wordId],
        },
        10,
        0,
      );
    });
  }, []);

  const completeLesson = useCallback((lessonId: string) => {
    setState((current) => {
      if (current.completedLessonIds.includes(lessonId)) return current;
      return withActivity(
        {
          ...current,
          completedLessonIds: [...current.completedLessonIds, lessonId],
        },
        20,
        0,
      );
    });
  }, []);

  const awardCorrectAnswer = useCallback((countsForCurriculum = false) => {
    setState((current) => withActivity(
      current,
      XP_PER_CORRECT,
      countsForCurriculum ? XP_PER_CORRECT : 0,
    ));
  }, []);

  const recordGame = useCallback(() => {
    setState((current) => ({
      ...withActivity(current, 0, 0),
      gamesPlayed: current.gamesPlayed + 1,
    }));
  }, []);

  const value = useMemo<LearningContextValue>(() => {
    const level = Math.min(4, Math.floor(state.curriculumXp / 100) + 1);
    return {
      ...state,
      hydrated,
      level,
      nextLevelXp: level < 4 ? level * 100 : 300,
      setAgeBand,
      awardCorrectAnswer,
      markWordLearned,
      completeLesson,
      recordGame,
    };
  }, [state, hydrated, setAgeBand, awardCorrectAnswer, markWordLearned, completeLesson, recordGame]);

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearning must be used within LearningProvider');
  }
  return context;
}
