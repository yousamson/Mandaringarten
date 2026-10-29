import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/react';
import {
  getGetBillingStatusQueryKey,
  getGetLearningProgressQueryKey,
  useGetBillingStatus,
  useGetLearningProgress,
  useRecordLearningRound,
  useUpdateLearningProgress,
} from '@workspace/api-client-react';
import type { GameMode } from '@/lib/playground-copy';
import { toStage, type StageNumber } from '@/lib/playground-content';

export const XP_COMPLETE = 100;
export const XP_PER_CORRECT = 5;

export type NormalizedProgress = { selectedStage: StageNumber; xpByStage: [number, number, number, number]; totalXp: number };

export function normalizeProgress(data: { selectedStage: number; xpByStage: number[] } | undefined | null): NormalizedProgress | null {
  if (!data) return null;
  const xp = [0, 1, 2, 3].map((i) => {
    const v = Number(data.xpByStage?.[i] ?? 0);
    return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
  }) as [number, number, number, number];
  return { selectedStage: toStage(data.selectedStage), xpByStage: xp, totalXp: xp.reduce((a, b) => a + b, 0) };
}

export function useMembership() {
  const { isSignedIn, isLoaded, user } = useUser();
  const uid = user?.id ?? null;
  const billing = useGetBillingStatus({ query: { enabled: Boolean(isSignedIn), queryKey: [...getGetBillingStatusQueryKey(), uid], retry: false } });
  const premium = Boolean(isSignedIn && billing.data?.isPremium === true);
  const checking = !isLoaded || Boolean(isSignedIn && billing.isLoading);
  return { isLoaded, isSignedIn: Boolean(isSignedIn), user, uid, billing, premium, checking };
}

export const progressQueryKey = (uid: string | null) => [...getGetLearningProgressQueryKey(), uid];

/** Server progress is the source of truth; refetched on mount and focus, keyed per account. */
export function useLearningProgress(uid: string | null, enabled = true) {
  const query = useGetLearningProgress({
    query: { enabled: enabled && Boolean(uid), queryKey: progressQueryKey(uid), refetchOnMount: 'always', refetchOnWindowFocus: true, retry: 1 },
  });
  return { ...query, progress: normalizeProgress(query.data) };
}

export function useSelectStage(uid: string | null) {
  const client = useQueryClient();
  const mutation = useUpdateLearningProgress();
  const select = (stage: number, callbacks?: { onError?: () => void }) => {
    mutation.mutate(
      { data: { selectedStage: toStage(stage) } },
      {
        onSuccess: (result) => {
          client.setQueryData(progressQueryKey(uid), result);
          void client.invalidateQueries({ queryKey: progressQueryKey(uid) });
        },
        onError: () => callbacks?.onError?.(),
      },
    );
  };
  return { select, isPending: mutation.isPending, isError: mutation.isError, pendingStage: mutation.isPending ? mutation.variables?.data.selectedStage ?? null : null, reset: mutation.reset };
}

export function useRecordRound(uid: string | null) {
  const client = useQueryClient();
  const mutation = useRecordLearningRound();
  const record = (input: { stage: number; mode: GameMode; roundId: string; correctCount: number }, callbacks?: { onSuccess?: () => void; onError?: () => void }) => {
    mutation.mutate(
      { data: { stage: toStage(input.stage), mode: input.mode, roundId: input.roundId, correctCount: Math.max(0, Math.min(5, Math.floor(input.correctCount))) } },
      {
        onSuccess: (result) => {
          client.setQueryData(progressQueryKey(uid), result);
          void client.invalidateQueries({ queryKey: progressQueryKey(uid) });
          callbacks?.onSuccess?.();
        },
        onError: () => callbacks?.onError?.(),
      },
    );
  };
  return { record, isPending: mutation.isPending };
}

const legacyKey = (uid: string) => `mg-curriculum-progress:${uid}`;
const migratedKey = (uid: string) => `mg-playground-legacy-migrated:${uid}`;

function readLegacyXp(uid: string): number {
  try {
    if (localStorage.getItem(migratedKey(uid))) return 0;
    const raw = localStorage.getItem(legacyKey(uid));
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { xp?: unknown };
    const xp = Number(parsed?.xp);
    return Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
  } catch {
    return 0;
  }
}

/** One-time import of earlier browser-only XP into the server. The server stays the authority. */
export function useLegacyProgressMigration(uid: string | null, progress: NormalizedProgress | null, canWrite: boolean) {
  const client = useQueryClient();
  const mutation = useUpdateLearningProgress();
  const mutateRef = useRef(mutation.mutate);
  mutateRef.current = mutation.mutate;
  const attempted = useRef<string | null>(null);
  const selected = progress?.selectedStage ?? null;

  useEffect(() => {
    if (!uid || !canWrite || selected === null || attempted.current === uid) return;
    const legacyXpTotal = readLegacyXp(uid);
    if (!legacyXpTotal) return;
    attempted.current = uid;
    mutateRef.current(
      { data: { selectedStage: selected, legacyXpTotal } },
      {
        onSuccess: (result) => {
          try { localStorage.setItem(migratedKey(uid), new Date().toISOString()); } catch { /* storage unavailable; server merge is idempotent */ }
          client.setQueryData(progressQueryKey(uid), result);
          void client.invalidateQueries({ queryKey: progressQueryKey(uid) });
        },
        onError: () => { attempted.current = null; },
      },
    );
  }, [uid, canWrite, selected, client]);
}
