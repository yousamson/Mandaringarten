import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useSSO } from '@clerk/expo/experimental';
import { useRouter } from 'expo-router';
import { ActionButton, Screen, Surface } from '@/components/LearningUI';
import { useLanguage } from '@/context/LanguageContext';
import { languageOptions, translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';

WebBrowser.maybeCompleteAuthSession();

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { startSSOFlow } = useSSO();
  const [error, setError] = useState('');
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);
  const t = (key: string) => translate(language, key);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const signInWithGoogle = async () => {
    setError('');
    setIsSigningInWithGoogle(true);
    try {
      const { createdSessionId, signUp, authSessionResult } =
        await startSSOFlow({
          strategy: 'oauth_google',
          redirectUrl:
            Platform.OS === 'web'
              ? AuthSession.makeRedirectUri()
              : AuthSession.makeRedirectUri({ scheme: 'mandarin-garden' }),
        });
      if (createdSessionId || signUp?.status === 'complete') {
        if (!createdSessionId) {
          const { error: finalizeError } = await signUp!.finalize();
          if (finalizeError) throw finalizeError;
        }
        router.replace('/(tabs)');
        return;
      }

      if (
        authSessionResult?.type === 'cancel' ||
        authSessionResult?.type === 'dismiss'
      ) {
        return;
      }

      if (signUp?.status === 'missing_requirements') {
        router.replace('/(auth)/sign-up?continueOAuth=1');
        return;
      }

      setError(t('auth.googleError'));
    } catch (caughtError) {
      const clerkError =
        caughtError && typeof caughtError === 'object'
          ? (caughtError as {
        code?: string;
        errors?: Array<{ code?: string }>;
            })
          : {};
      const errorCodes = [
        clerkError.code,
        ...(clerkError.errors ?? []).map((item) => item.code),
      ];
      const providerSetupError = errorCodes.some(
        (code) =>
          code === 'oauth_provider_not_enabled' ||
          code === 'oauth_not_enabled' ||
          code === 'strategy_not_enabled',
      );
      setError(providerSetupError ? t('auth.googleSetup') : t('auth.googleError'));
    } finally {
      setIsSigningInWithGoogle(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.languages}>
          {languageOptions.map((option) => {
            const active = language === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => void setLanguage(option.value)}
                style={[
                  styles.language,
                  {
                    backgroundColor: active ? colors.secondary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.languageText, { color: colors.foreground }]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.hero}>
          <View style={[styles.logo, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.logoText, { color: colors.primary }]}>字</Text>
          </View>
          <Text style={[styles.brand, { color: colors.foreground }]}>
            {t('app.name')}
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t('auth.welcomeTitle')}
          </Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            {t('app.description')}
          </Text>
          <Text style={[styles.descriptionChinese, { color: colors.mutedForeground }]}>
            {t('app.descriptionChinese')}
          </Text>
        </View>

        <Surface style={styles.actions}>
          <ActionButton
            label={t('auth.createAccount')}
            onPress={() => router.push('/(auth)/sign-up')}
            testID="welcome-sign-up"
            icon={<Text style={{ color: colors.primaryForeground, fontSize: 18 }}>＋</Text>}
          />
          <ActionButton
            label={t('auth.signIn')}
            onPress={() => router.push('/(auth)/sign-in')}
            tone="outline"
            testID="welcome-sign-in"
          />
          <ActionButton
            label={t('auth.google')}
            onPress={() => void signInWithGoogle()}
            tone="soft"
            loading={isSigningInWithGoogle}
            testID="welcome-google"
          />
          {error ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: colors.destructive }]}>
              {error}
            </Text>
          ) : null}
        </Surface>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 24 },
  languages: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  language: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  languageText: { fontSize: 12, fontWeight: '700' },
  hero: { alignItems: 'center', gap: 12, paddingHorizontal: 8 },
  logo: { width: 72, height: 72, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 37, fontWeight: '800' },
  brand: { textAlign: 'center', fontSize: 22, fontWeight: '800' },
  title: { textAlign: 'center', fontSize: 25, fontWeight: '800' },
  description: { textAlign: 'center', fontSize: 14, lineHeight: 21 },
  descriptionChinese: { textAlign: 'center', fontSize: 13, lineHeight: 20 },
  actions: { gap: 12 },
  error: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
