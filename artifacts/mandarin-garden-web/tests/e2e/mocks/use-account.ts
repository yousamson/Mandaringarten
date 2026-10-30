export function useAccountAccess() {
  return {
    uid: 'browser-test-parent',
    isLoaded: true,
    isSignedIn: true,
    data: { access: 'active', isAdmin: false },
    isAdmin: false,
    query: { isLoading: false, isError: false, refetch: async () => undefined },
  };
}

export function clearUserLocalData() {}
