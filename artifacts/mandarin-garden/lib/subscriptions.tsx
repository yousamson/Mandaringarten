import React, { createContext, useContext, useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuth, useUser } from '@clerk/expo';
import { useMutation } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import {
  setAuthTokenGetter,
  useCreateBillingPortal,
  useGetAccountAccess,
  useGetBillingStatus,
  getGetAccountAccessQueryKey,
  getGetBillingStatusQueryKey,
} from '@workspace/api-client-react';

export function getWebsiteOrigin(): string {
  const configured =
    process.env.EXPO_PUBLIC_WEB_URL?.trim() ||
    process.env.EXPO_PUBLIC_DOMAIN?.trim();
  if (!configured) {
    throw new Error('The Mandarin Garden website address is not configured.');
  }
  const url = new URL(
    configured.match(/^https?:\/\//i) ? configured : `https://${configured}`,
  );
  return url.origin;
}

function getBillingReturnOrigin(): string {
  return Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location.origin
    : getWebsiteOrigin();
}

function useSubscriptionValue() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  setAuthTokenGetter(isLoaded && isSignedIn ? getToken : null);

  const siteOrigin = getWebsiteOrigin();
  const request = Platform.OS === 'web'
    ? undefined
    : { headers: { Origin: siteOrigin } };
  const userId = user?.id ?? 'signed-out';

  const billingKey = [...getGetBillingStatusQueryKey(), userId];
  const accessKey = [...getGetAccountAccessQueryKey(), userId];
  const access = useGetAccountAccess({
    query: {
      enabled: isLoaded && Boolean(isSignedIn),
      queryKey: accessKey,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      refetchInterval: 30_000,
      retry: 1,
    },
  });
  const status = useGetBillingStatus({
    query: {
      enabled: isLoaded && Boolean(isSignedIn) && Boolean(access.data) && access.data?.isAdmin !== true,
      queryKey: billingKey,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      retry: 1,
    },
  });
  const portalRequest = useCreateBillingPortal({ request });
  const isAdmin = access.data?.isAdmin === true;

  useEffect(() => {
    if (Platform.OS === 'web' || !isLoaded || !isSignedIn) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void access.refetch();
      if (access.data?.isAdmin !== true) void status.refetch();
    });
    return () => subscription.remove();
  }, [isLoaded, isSignedIn, access.data?.isAdmin, access.refetch, status.refetch]);

  const manage = useMutation({
    mutationFn: async () => {
      if (!isLoaded || !isSignedIn) {
        throw new Error('Sign in to manage your subscription.');
      }
      const origin = getBillingReturnOrigin();
      const response = await portalRequest.mutateAsync({
        data: { returnUrl: `${origin}/parent` },
      });
      if (Platform.OS === 'web') {
        if (typeof window === 'undefined') {
          throw new Error('Subscription management is only available in a browser.');
        }
        window.location.assign(response.url);
        return;
      }
      await WebBrowser.openBrowserAsync(response.url);
    },
    onSuccess: async () => {
      if (Platform.OS !== 'web') {
        await Promise.all([status.refetch(), access.refetch()]);
      }
    },
  });

  const isPremium =
    isAdmin || Boolean(status.data?.isPremium || access.data?.isPremium);
  const isMembershipKnown =
    isAdmin || Boolean(access.data || status.data);

  return {
    isAdmin,
    isPremium,
    isMembershipKnown,
    isAccountAccessKnown: Boolean(access.data),
    currentPeriodEnd: status.data?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: status.data?.cancelAtPeriodEnd ?? false,
    isSignedIn: Boolean(isSignedIn),
    hasBillingData: Boolean(status.data && access.data),
    refresh: async () => {
      if (!isLoaded || !isSignedIn) return;
      await Promise.all([status.refetch(), access.refetch()]);
    },
    manageSubscription: manage.mutateAsync,
    isManagingSubscription: manage.isPending,
  };
}

type SubscriptionValue = ReturnType<typeof useSubscriptionValue>;
const SubscriptionContext = createContext<SubscriptionValue | null>(null);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useSubscriptionValue();
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}
