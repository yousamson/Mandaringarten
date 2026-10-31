import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/react';
import {
  getGetBillingStatusQueryKey,
  getGetLearningProgressQueryKey,
  useGetBillingStatus,
  useGetLearningProgress,
  issueLearningRound,
  recordLearningRound,
  useUpdateLearningProgress,
} from '@workspace/api-client-react';
import type { LearningProgress, LearningRound, LearningRoundInput, LearningRoundRequest } from '@workspace/api-client-react';
import { acknowledgeRound, OUTBOX_EVENT, pendingRounds, queueRound } from '@/lib/progress-outbox';
import { toStage, type StageNumber } from '@/lib/playground-content';
import { useAccountAccess } from '@/hooks/use-account';

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
  const account = useAccountAccess();
  const uid = user?.id ?? null;
  const billing = useGetBillingStatus({ query: {
    enabled: Boolean(isSignedIn && account.data && !account.isAdmin),
    queryKey: [...getGetBillingStatusQueryKey(), uid],
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  } });
  const premium = Boolean(isSignedIn && (billing.data?.isPremium === true || account.isAdmin));
  const checking = !isLoaded || Boolean(isSignedIn && (
    account.query.isLoading || (!account.data && !account.query.isError) ||
    (account.data && !account.isAdmin && billing.isLoading)
  ));
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
  const { getToken, userId } = useAuth();
  const currentUser = useRef(userId);
  currentUser.current = userId;
  const mutation = useMutation({
    mutationFn: async (data: LearningRoundInput) => {
      if (!uid || currentUser.current !== uid) throw new Error('Account changed.');
      // Persist before sending. The same round ID survives network failure and reload.
      // If storage is unavailable, still attempt the server; an error remains visible in the round.
      try { queueRound(uid, data); } catch { /* server save remains available */ }
      const token = await getToken();
      if (!token || currentUser.current !== uid) throw new Error('Sign in to save progress.');
      const result = await recordLearningRound(data, { headers: { Authorization: `Bearer ${token}` } });
      if (!result.correct) throw new Error('The answer was not confirmed by the server.');
      try { acknowledgeRound(uid, data.roundId, data.questionId); } catch { /* replay is server-idempotent */ }
      if (currentUser.current === uid) {
        client.setQueryData<LearningProgress>(progressQueryKey(uid), (current) => current ? {
          selectedStage: current.selectedStage,
          xpByStage: result.xpByStage.map((xp, index) => Math.max(xp, current.xpByStage[index] ?? 0)),
        } : { selectedStage: result.selectedStage, xpByStage: result.xpByStage });
        void client.invalidateQueries({ queryKey: progressQueryKey(uid) });
      }
      return { selectedStage: result.selectedStage, xpByStage: result.xpByStage };
    },
  });
  const record = (input: LearningRoundInput, callbacks?: { onSuccess?: () => void; onError?: () => void }) => {
    mutation.mutate(
      input,
      {
        onSuccess: () => callbacks?.onSuccess?.(),
        onError: () => callbacks?.onError?.(),
      },
    );
  };
  return { record, replay: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useIssueLearningRound(uid: string | null) {
  const { getToken, userId } = useAuth();
  const currentUser = useRef(userId);
  currentUser.current = userId;
  const mutation = useMutation({
    mutationFn: async (data: LearningRoundRequest): Promise<LearningRound> => {
      if (!uid || currentUser.current !== uid) throw new Error('Account changed.');
      const token = await getToken();
      if (!token || currentUser.current !== uid) throw new Error('Sign in to start a game.');
      return issueLearningRound(data, { headers: { Authorization: `Bearer ${token}` } });
    },
  });
  return { issue: mutation.mutateAsync, isPending: mutation.isPending, isError: mutation.isError };
}

/** Resume only this signed-in account's unacknowledged rounds, including after reload. */
export function usePendingRoundSync(uid: string | null, enabled: boolean) {
  const { replay } = useRecordRound(uid);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState(false);
  const replayRef = useRef(replay);
  replayRef.current = replay;
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!uid || !enabled) return;
    let cancelled = false;
    let syncing = false;
    const count = () => {
      try { setPending(pendingRounds(uid).length); }
      catch { setError(true); }
    };
    const sync = async () => {
      if (syncing || cancelled) return;
      syncing = true;
      try {
        for (const round of pendingRounds(uid)) {
          if (cancelled) break;
          await replayRef.current(round);
        }
        if (!cancelled) setError(false);
      } catch { if (!cancelled) setError(true); }
      finally { syncing = false; if (!cancelled) count(); }
    };
    count();
    void sync();
    const resume = () => { void sync(); };
    window.addEventListener('online', resume);
    window.addEventListener('focus', resume);
    window.addEventListener('storage', resume);
    window.addEventListener(OUTBOX_EVENT, count);
    const timer = window.setInterval(resume, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('online', resume);
      window.removeEventListener('focus', resume);
      window.removeEventListener('storage', resume);
      window.removeEventListener(OUTBOX_EVENT, count);
    };
  }, [uid, enabled, retry]);
  return { pending, error, retry: () => setRetry((n) => n + 1) };
}

const legacyKey = (uid: string) => `mg-curriculum-progress:${uid}`;
const migratedKey = (uid: string) => `mg-playground-legacy-migrated:${uid}`;

function readLegacyXp(uid: string): number {
  try {
    const raw = localStorage.getItem(legacyKey(uid));
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { xp?: unknown };
    const xp = Number(parsed?.xp);
    const snapshot = Number.isFinite(xp) && xp > 0 ? Math.min(400, Math.floor(xp)) : 0;
    // Older timestamp markers are deliberately rechecked by the idempotent server merge.
    const migrated = Number(localStorage.getItem(migratedKey(uid))) || 0;
    return snapshot > migrated ? snapshot : 0;
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
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!uid || !canWrite || selected === null || attempted.current === `${uid}:${retry}`) return;
    const legacyXpTotal = readLegacyXp(uid);
    if (!legacyXpTotal) return;
    attempted.current = `${uid}:${retry}`;
    setError(false);
    mutateRef.current(
      { data: { selectedStage: selected, legacyXpTotal } },
      {
        onSuccess: (result) => {
          try { localStorage.setItem(migratedKey(uid), String(legacyXpTotal)); } catch { /* storage unavailable; server merge is idempotent */ }
          client.setQueryData(progressQueryKey(uid), result);
          void client.invalidateQueries({ queryKey: progressQueryKey(uid) });
        },
        onError: () => { setError(true); },
      },
    );
  }, [uid, canWrite, selected, client, retry]);
  return { error, retry: () => setRetry((n) => n + 1) };
}
