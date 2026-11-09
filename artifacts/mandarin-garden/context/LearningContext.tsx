import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth, useUser } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetLearningProgressQueryKey,
  useGetLearningProgress,
  useRecordGardenCare,
  useUpdateLearningProgress,
} from '@workspace/api-client-react';
import { normalizeAgeStage, XP_PER_CORRECT, XP_PER_INCORRECT, type GardenCareType, type GardenStatus } from '@workspace/learning-content';
import { useSubscription } from '@/lib/subscriptions';
import type { AgeBand } from '@/data/vocabulary';

const STORAGE_KEY = 'mandarin-garden-learning-v1';
export { XP_PER_CORRECT, XP_PER_INCORRECT };

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
  selectedStage: number;
  xpByStage: number[];
  selectedStageXp: number;
  garden: GardenStatus | null;
  progressLoading: boolean;
  selectStage: (stage: number) => Promise<void>;
  careForGarden: (type: GardenCareType) => Promise<void>;
  setAgeBand: (ageBand: AgeBand) => void;
  awardCorrectAnswer: (countsForCurriculum?: boolean) => void;
  markWordLearned: (wordId: string) => void;
  completeLesson: (lessonId: string) => void;
  recordGame: () => void;
};

const initialState: LearningState = {
  ageBand: '2-3',
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
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { isPremium } = useSubscription();
  const queryClient = useQueryClient();
  const progressKey = useMemo(
    () => [...getGetLearningProgressQueryKey(), user?.id ?? 'signed-out'],
    [user?.id],
  );
  const progressQuery = useGetLearningProgress({
    query: {
      enabled: isLoaded && Boolean(isSignedIn) && isPremium,
      queryKey: progressKey,
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
  });
  const updateProgress = useUpdateLearningProgress();
  const gardenCareMutation = useRecordGardenCare();
  const [state, setState] = useState<LearningState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        if (stored) {
          const parsed = JSON.parse(stored) as Record<string, unknown>;
          setState({
            ...initialState,
            ...parsed,
            ageBand: normalizeAgeStage(
              typeof parsed.ageBand === 'string' ? parsed.ageBand : null,
            ),
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

  const selectedStage = isPremium
    ? (progressQuery.data?.selectedStage ?? 1)
    : 1;
  const xpByStage = isPremium
    ? (progressQuery.data?.xpByStage ?? [0, 0, 0, 0])
    : [0, 0, 0, 0];
  const selectedStageXp = xpByStage[selectedStage - 1] ?? 0;
  const garden = isPremium ? (progressQuery.data?.garden ?? null) : null;

  const selectStage = useCallback(
    async (stage: number) => {
      if (!Number.isInteger(stage) || stage < 1 || stage > 4) {
        throw new Error('Choose a learning stage from 1 to 4.');
      }
      if (!isPremium) {
        throw new Error('An active membership is required to choose a stage.');
      }
      const updated = await updateProgress.mutateAsync({
        data: { selectedStage: stage },
      });
      queryClient.setQueryData(progressKey, updated);
    },
    [isPremium, progressKey, queryClient, updateProgress],
  );

  const careForGarden = useCallback(async (type: GardenCareType) => {
    if (!isPremium) throw new Error('An active membership is required to care for the garden.');
    const updated = await gardenCareMutation.mutateAsync({ data: { type } });
    queryClient.setQueryData(progressKey, updated);
    void queryClient.invalidateQueries({ queryKey: progressKey });
  }, [gardenCareMutation, isPremium, progressKey, queryClient]);

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
    const level = selectedStage;
    return {
      ...state,
      hydrated,
      level,
      curriculumXp: selectedStageXp,
      selectedStage,
      xpByStage,
      selectedStageXp,
      garden,
      progressLoading: progressQuery.isLoading,
      nextLevelXp: Math.max(0, 100 - selectedStageXp),
      selectStage,
      careForGarden,
      setAgeBand,
      awardCorrectAnswer,
      markWordLearned,
      completeLesson,
      recordGame,
    };
  }, [
    state,
    hydrated,
    selectedStage,
    selectedStageXp,
    xpByStage,
    garden,
    progressQuery.isLoading,
    selectStage,
    careForGarden,
    setAgeBand,
    awardCorrectAnswer,
    markWordLearned,
    completeLesson,
    recordGame,
  ]);

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
