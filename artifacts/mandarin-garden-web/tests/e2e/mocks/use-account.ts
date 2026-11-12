export function useAccountAccess() {
  const isAdmin = new URLSearchParams(window.location.search).get('admin') === '1';
  return {
    uid: 'browser-test-parent',
    isLoaded: true,
    isSignedIn: true,
    data: { access: 'active', isAdmin },
    isAdmin,
    query: { isLoading: false, isError: false, refetch: async () => undefined },
  };
}

export function clearUserLocalData() {}

export const accessQueryKey = (uid: string | null) => ['account-access', uid];
export const threadsQueryKey = (uid: string | null) => ['support-threads', uid];
export const conversationQueryKey = (threadId: string, uid: string | null) => ['support-conversation', threadId, uid];

export function useSupportThreads() {
  return { data: [], isLoading: false, isError: false, refetch: async () => undefined };
}

export function useSupportConversation() {
  return { data: undefined, isLoading: false, isError: false, refetch: async () => undefined };
}
