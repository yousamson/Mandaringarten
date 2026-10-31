import { useUser } from '@clerk/react';
import {
  getGetAccountAccessQueryKey,
  getGetSupportConversationQueryKey,
  getGetSupportThreadsQueryKey,
  getAccountAccess,
  useGetAccountAccess,
  useGetSupportConversation,
  useGetSupportThreads,
} from '@workspace/api-client-react';
import { withAbortTimeout } from '@/lib/with-abort-timeout';

export const accessQueryKey = (uid: string | null) => [...getGetAccountAccessQueryKey(), uid];
export const threadsQueryKey = (uid: string | null) => [...getGetSupportThreadsQueryKey(), uid];
export const conversationQueryKey = (threadId: string, uid: string | null) => [...getGetSupportConversationQueryKey(threadId), uid];

/** Server-decided access. Fails closed: callers must treat loading/error as "no access". */
export function useAccountAccess() {
  const { isSignedIn, isLoaded, user } = useUser();
  const uid = user?.id ?? null;
  const query = useGetAccountAccess({
    query: {
      enabled: Boolean(isSignedIn && uid),
      queryKey: accessQueryKey(uid),
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      refetchInterval: 30_000,
      retry: false,
      queryFn: ({ signal }) =>
        withAbortTimeout(signal, 12_000, (requestSignal) =>
          getAccountAccess({ signal: requestSignal }),
        ),
    },
  });
  const data = query.isError ? undefined : query.data;
  return { uid, isLoaded, isSignedIn: Boolean(isSignedIn), query, data, isAdmin: data?.isAdmin === true };
}

export function useSupportThreads(uid: string | null, enabled: boolean) {
  return useGetSupportThreads({
    query: { enabled: enabled && Boolean(uid), queryKey: threadsQueryKey(uid), refetchInterval: 10_000, refetchOnWindowFocus: true, refetchOnMount: 'always', retry: 1 },
  });
}

export function useSupportConversation(threadId: string | null, uid: string | null) {
  return useGetSupportConversation(threadId ?? '', {
    query: { enabled: Boolean(threadId && uid), queryKey: conversationQueryKey(threadId ?? '', uid), refetchInterval: 10_000, refetchOnWindowFocus: true, retry: 1 },
  });
}

const PROGRESS_PREFIXES = ['mg-curriculum-progress:', 'mg-playground-legacy-migrated:', 'mg-pending-round:'];

/** Removes user-specific learning data left in this browser. */
export function clearUserLocalData(uid: string | null) {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && PROGRESS_PREFIXES.some((p) => k.startsWith(p) && (!uid || k === `${p}${uid}` || (p === 'mg-pending-round:' && k.startsWith(`${p}${uid}:`))))) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch { /* storage unavailable */ }
  try { sessionStorage.removeItem('mg-auth-consent'); } catch { /* ignore */ }
}
