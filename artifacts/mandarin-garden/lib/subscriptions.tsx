import React, { createContext, useContext } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';

export const PREMIUM_ENTITLEMENT = 'premium';

const testKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

let configured = false;

export function initializeRevenueCat(): boolean {
  if (configured) return true;

  const isPreview =
    __DEV__ ||
    Platform.OS === 'web' ||
    Constants.executionEnvironment === 'storeClient';
  const apiKey = isPreview
    ? testKey
    : Platform.OS === 'ios'
      ? iosKey
      : Platform.OS === 'android'
        ? androidKey
        : testKey;

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
  const customerInfo = useQuery({
    queryKey: ['subscriptions', 'customer-info'],
    queryFn: () => Purchases.getCustomerInfo(),
    enabled: configured,
    staleTime: 60_000,
  });
  const offerings = useQuery({
    queryKey: ['subscriptions', 'offerings'],
    queryFn: () => Purchases.getOfferings(),
    enabled: configured,
    staleTime: 300_000,
  });

  const purchase = useMutation({
    mutationFn: async (
      packageToPurchase: Parameters<typeof Purchases.purchasePackage>[0],
    ) => {
      const result = await Purchases.purchasePackage(packageToPurchase);
      return result.customerInfo;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const restore = useMutation({
    mutationFn: () => Purchases.restorePurchases(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const packageToPurchase =
    offerings.data?.current?.availablePackages.find(
      (availablePackage) => availablePackage.packageType === 'MONTHLY',
    ) ?? offerings.data?.current?.availablePackages[0];
  const isPremium =
    customerInfo.data?.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;

  return {
    configured,
    isPremium,
    offerings: offerings.data,
    packageToPurchase,
    priceLabel: packageToPurchase?.product.priceString ?? null,
    isLoading: configured && (customerInfo.isLoading || offerings.isLoading),
    error: offerings.error ?? customerInfo.error ?? null,
    refresh: async () => {
      await Promise.all([offerings.refetch(), customerInfo.refetch()]);
    },
    purchase: purchase.mutateAsync,
    restore: restore.mutateAsync,
    isPurchasing: purchase.isPending,
    isRestoring: restore.isPending,
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
