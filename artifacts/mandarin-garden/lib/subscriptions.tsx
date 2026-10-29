import React, { createContext, useContext } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useAuth } from '@clerk/expo';
import {
  setAuthTokenGetter,
  useCreateBillingCheckout,
  useCreateBillingPortal,
  useGetBillingPlan,
  useGetBillingSubscription,
} from '@workspace/api-client-react';

export const PREMIUM_ENTITLEMENT = 'premium';

const testKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

let configured = false;

export function initializeRevenueCat(): boolean {
  if (Platform.OS === 'web') return false;
  if (configured) return true;

  const isTestStoreEnvironment =
    Constants.executionEnvironment === 'storeClient';
  const nativeStoreKey =
    Platform.OS === 'ios'
      ? iosKey
      : Platform.OS === 'android'
        ? androidKey
        : undefined;
  const apiKey = isTestStoreEnvironment
    ? testKey
    : nativeStoreKey ?? (__DEV__ ? testKey : undefined);

  if (!apiKey) return false;

  try {
    Purchases.configure({ apiKey });
    configured = true;
    return true;
  } catch {
    return false;
  }
}

function useSubscriptionValue() {
  const queryClient = useQueryClient();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  setAuthTokenGetter(getToken);
  const isWeb = Platform.OS === 'web';
  const webPlan = useGetBillingPlan({
    query: {
      enabled: isWeb,
      staleTime: 300_000,
    },
  });
  const webStatus = useGetBillingSubscription({
    query: {
      enabled: isWeb && isLoaded && Boolean(isSignedIn),
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
  });
  const customerInfo = useQuery({
    queryKey: ['subscriptions', 'customer-info'],
    queryFn: () => Purchases.getCustomerInfo(),
    enabled: configured && !isWeb,
    staleTime: 60_000,
  });
  const offerings = useQuery({
    queryKey: ['subscriptions', 'offerings'],
    queryFn: () => Purchases.getOfferings(),
    enabled: configured && !isWeb,
    staleTime: 300_000,
  });
  const checkoutRequest = useCreateBillingCheckout();
  const portalRequest = useCreateBillingPortal();

  const purchase = useMutation({
    mutationFn: async (
      packageToPurchase?: Parameters<typeof Purchases.purchasePackage>[0],
    ) => {
      if (isWeb) {
        if (typeof window === 'undefined') {
          throw new Error('Checkout is only available in a browser.');
        }
        if (!isLoaded || !isSignedIn) {
          throw new Error('Sign in before starting checkout.');
        }
        const checkout = await checkoutRequest.mutateAsync({
          data: { returnUrl: window.location.href },
        });
        window.location.assign(checkout.url);
        return null;
      }
      if (!packageToPurchase) {
        throw new Error('A monthly store package is not available.');
      }
      const result = await Purchases.purchasePackage(packageToPurchase);
      return result.customerInfo;
    },
    onSuccess: async () => {
      if (!isWeb) {
        await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      }
    },
  });

  const restore = useMutation({
    mutationFn: () => {
      if (isWeb) {
        throw new Error('Web subscriptions are managed through Stripe.');
      }
      return Purchases.restorePurchases();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const manageSubscription = useMutation({
    mutationFn: async () => {
      if (!isWeb || typeof window === 'undefined') {
        throw new Error('Subscription management is only available on the web.');
      }
      if (!isLoaded || !isSignedIn) {
        throw new Error('Sign in to manage your subscription.');
      }
      const portal = await portalRequest.mutateAsync({
        data: { returnUrl: window.location.href },
      });
      window.location.assign(portal.url);
    },
  });

  const packageToPurchase =
    offerings.data?.current?.availablePackages.find(
      (availablePackage) => availablePackage.packageType === 'MONTHLY',
    );
  const nativeIsPremium =
    customerInfo.data?.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
  const isPremium = isWeb
    ? (webStatus.data?.isPremium ?? false)
    : nativeIsPremium;

  return {
    isWeb,
    configured: isWeb ? Boolean(webPlan.data) : configured,
    isPremium,
    hasBillingCustomer: isWeb
      ? (webStatus.data?.hasBillingCustomer ?? false)
      : false,
    offerings: offerings.data,
    packageToPurchase,
    canPurchase: isWeb
      ? Boolean(
          webPlan.data &&
            webStatus.isSuccess &&
            !webStatus.data.isPremium &&
            isLoaded &&
            isSignedIn,
        )
      : Boolean(packageToPurchase),
    priceLabel: isWeb
      ? (webPlan.data?.priceLabel ?? null)
      : (packageToPurchase?.product.priceString ?? null),
    isLoading: isWeb
      ? webPlan.isLoading ||
        (isLoaded && Boolean(isSignedIn) && webStatus.isLoading)
      : configured && (customerInfo.isLoading || offerings.isLoading),
    error: isWeb
      ? (webPlan.error ??
        webStatus.error ??
        checkoutRequest.error ??
        portalRequest.error ??
        null)
      : (offerings.error ?? customerInfo.error ?? null),
    refresh: async () => {
      if (isWeb) {
        await Promise.all([webPlan.refetch(), webStatus.refetch()]);
      } else {
        await Promise.all([offerings.refetch(), customerInfo.refetch()]);
      }
    },
    purchase: purchase.mutateAsync,
    restore: restore.mutateAsync,
    manageSubscription: manageSubscription.mutateAsync,
    isPurchasing: purchase.isPending,
    isRestoring: !isWeb && restore.isPending,
    isManagingSubscription: manageSubscription.isPending,
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
