import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Stack, useRouter, useSegments } from 'expo-router';
import { LearningProvider } from '@/context/LearningContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { setBaseUrl } from '@workspace/api-client-react';
import { SubscriptionProvider } from '@/lib/subscriptions';

const apiDomain = process.env.EXPO_PUBLIC_DOMAIN?.trim();
setBaseUrl(
  apiDomain
    ? `https://${apiDomain.replace(/^https?:\/\//i, '').replace(/\/+$/, '')}`
    : null,
);

const queryClient = new QueryClient();
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
const clerkProxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    const inAuthFlow = segments[0] === '(auth)';
    const inApp = segments[0] === '(tabs)';
    if (!isSignedIn && inApp) router.replace('/(auth)/welcome');
    if (isSignedIn && inAuthFlow) router.replace('/(tabs)');
  }, [isLoaded, isSignedIn, router, segments]);

  if (!isLoaded) return null;
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ClerkProvider
            publishableKey={clerkPublishableKey}
            tokenCache={tokenCache}
            proxyUrl={clerkProxyUrl}
          >
            <ClerkLoaded>
              <SubscriptionProvider>
                <LanguageProvider>
                  <LearningProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <KeyboardProvider>
                        <RootLayoutNav />
                      </KeyboardProvider>
                    </GestureHandlerRootView>
                  </LearningProvider>
                </LanguageProvider>
              </SubscriptionProvider>
            </ClerkLoaded>
          </ClerkProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
