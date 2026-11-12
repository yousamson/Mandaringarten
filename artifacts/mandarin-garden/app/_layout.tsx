import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Stack, useRouter, useSegments } from 'expo-router';
import { LearningProvider } from '@/context/LearningContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { setBaseUrl } from '@workspace/api-client-react';
import { SubscriptionProvider } from '@/lib/subscriptions';
import colors from '@/constants/colors';

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
    const inApp = segments[0] === '(tabs)' || ['challenge', 'stories', 'translation', 'garden'].includes(String(segments[0]));
    if (!isSignedIn && inApp) router.replace('/(auth)/welcome');
    if (isSignedIn && inAuthFlow) router.replace('/(tabs)');
  }, [isLoaded, isSignedIn, router, segments]);

  if (!isLoaded) return null;
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="challenge" options={{ headerShown: true }} />
      <Stack.Screen name="stories" options={{ headerShown: true }} />
      <Stack.Screen name="translation" options={{ headerShown: true }} />
      <Stack.Screen name="garden" options={{ headerShown: true }} />
    </Stack>
  );
}

function ClerkGate() {
  const { isLoaded } = useAuth();
  if (!isLoaded) {
    return (
      <View style={styles.loadingScreen} accessibilityRole="progressbar" accessibilityLabel="Loading Mandarin Garden">
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.loadingIcon}
          resizeMode="contain"
          accessibilityLabel="Mandarin Garden icon"
        />
        <Text style={styles.loadingName}>Mandarin Garden</Text>
        <ActivityIndicator color={colors.light.primary} />
      </View>
    );
  }

  return (
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
            <ClerkGate />
          </ClerkProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: colors.light.background,
  },
  loadingIcon: {
    width: 104,
    height: 104,
  },
  loadingName: {
    color: colors.light.foreground,
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
