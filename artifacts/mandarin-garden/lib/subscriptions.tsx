import React, { createContext, useContext } from 'react';
import { Platform } from 'react-native';
import { useAuth, useUser } from '@clerk/expo';
import { useMutation } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import {
  setAuthTokenGetter,
  useCreateBillingCheckout,
  useCreateBillingPortal,
  useGetAccountAccess,
  useGetBillingPlan,
  useGetBillingSubscription,
  getGetAccountAccessQueryKey,
  getGetBillingSubscriptionQueryKey,
} from '@workspace/api-client-react';

const POLICY_VERSION = '2026-10-29.1';

export type CheckoutAcceptance = {
  privacyAccepted: boolean;
  disclaimerAccepted: boolean;
  noRefundAccepted: boolean;
};

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

  const plan = useGetBillingPlan({
    request: { skipAuth: true, cache: 'no-store' },
    query: {
      staleTime: 300_000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 5_000),
    },
  });
  const billingKey = [...getGetBillingSubscriptionQueryKey(), userId];
  const accessKey = [...getGetAccountAccessQueryKey(), userId];
  const status = useGetBillingSubscription({
    query: {
      enabled: isLoaded && Boolean(isSignedIn),
      queryKey: billingKey,
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
  });
  const access = useGetAccountAccess({
    query: {
      enabled: isLoaded && Boolean(isSignedIn),
      queryKey: accessKey,
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
  });
  const checkoutRequest = useCreateBillingCheckout({ request });
  const portalRequest = useCreateBillingPortal({ request });

  const checkout = useMutation({
    mutationFn: async (acceptance: CheckoutAcceptance) => {
      if (!isLoaded || !isSignedIn) {
        throw new Error('Sign in before starting checkout.');
      }
      if (
        !acceptance.privacyAccepted ||
        !acceptance.disclaimerAccepted ||
        !acceptance.noRefundAccepted
      ) {
        throw new Error('Confirm all subscription agreements before checkout.');
      }
      const origin = getBillingReturnOrigin();
      const response = await checkoutRequest.mutateAsync({
        data: {
          privacyAccepted: true,
          disclaimerAccepted: true,
          noRefundAccepted: true,
          policyVersion: POLICY_VERSION,
          successUrl: `${origin}/parent?billing=success`,
          cancelUrl: `${origin}/parent?billing=cancelled`,
        },
      });

      if (Platform.OS === 'web') {
        if (typeof window === 'undefined') {
          throw new Error('Checkout is only available in a browser.');
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

  const isAdmin = access.data?.isAdmin ?? false;
  const isPremium = isAdmin || (status.data?.isPremium ?? false);
  const hasBillingCustomer = status.data?.hasBillingCustomer ?? false;

  return {
    isWeb: Platform.OS === 'web',
    isAdmin,
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    configured: Boolean(plan.data),
    isPremium,
    hasBillingCustomer,
    isPlanLoading: plan.isLoading,
    planError: plan.error,
    accountError: status.error ?? access.error ?? null,
    canPurchase: Boolean(
      plan.data &&
        status.isSuccess &&
        access.isSuccess &&
        isLoaded &&
        isSignedIn &&
        !isPremium,
    ),
    priceLabel: plan.data?.priceLabel ?? null,
    isLoading:
      !isLoaded ||
      plan.isLoading ||
      (isLoaded && Boolean(isSignedIn) && (status.isLoading || access.isLoading)),
    error:
      plan.error ??
      status.error ??
      access.error ??
      checkoutRequest.error ??
      portalRequest.error ??
      null,
    refresh: async () => {
      await Promise.all([plan.refetch(), status.refetch(), access.refetch()]);
    },
    purchase: checkout.mutateAsync,
    manageSubscription: manage.mutateAsync,
    isPurchasing: checkout.isPending,
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
