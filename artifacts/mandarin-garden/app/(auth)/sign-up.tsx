import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSignUp } from '@clerk/expo';
import { ActionButton, Screen } from '@/components/LearningUI';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useLanguage } from '@/context/LanguageContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';

export default function SignUpScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();
  const { language } = useLanguage();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState('');
  const t = (key: string) => translate(language, key);
  const busy = fetchStatus === 'fetching';

  const finish = () =>
    signUp.finalize({
      navigate: ({ session }) => {
        if (session?.currentTask) return;
        router.replace('/(tabs)');
      },
    });

  const submit = async () => {
    setError('');
    try {
      const result = await signUp.password({ emailAddress, password });
      if (result.error) {
        setError(result.error.message || t('auth.genericError'));
        return;
      }
      if (signUp.status === 'complete') {
        await finish();
        return;
      }
      if (signUp.unverifiedFields.includes('email_address')) {
        await signUp.verifications.sendEmailCode();
        setNeedsCode(true);
      }
    } catch {
      setError(t('auth.genericError'));
    }
  };

  const verify = async () => {
    setError('');
    try {
      const result = await signUp.verifications.verifyEmailCode({ code });
      if (result.error) {
        setError(result.error.message || t('auth.genericError'));
        return;
      }
      if (signUp.status === 'complete') await finish();
    } catch {
      setError(t('auth.genericError'));
    }
  };

  return (
    <Screen>
      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={styles.content}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.brand, { color: colors.primary }]}>{t('app.name')}</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {needsCode ? t('auth.verifyTitle') : t('auth.createAccount')}
        </Text>
        <Text style={[styles.label, { color: colors.foreground }]}>{needsCode ? t('auth.code') : t('auth.email')}</Text>
        <TextInput
          style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
          value={needsCode ? code : emailAddress}
          onChangeText={needsCode ? setCode : setEmailAddress}
          placeholder={needsCode ? t('auth.code') : t('auth.email')}
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          keyboardType={needsCode ? 'number-pad' : 'email-address'}
          autoComplete={needsCode ? 'one-time-code' : 'email'}
        />
        {!needsCode ? (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>{t('auth.password')}</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.password')}
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoComplete="new-password"
            />
          </>
        ) : null}
        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        <ActionButton
          label={busy ? t('auth.loading') : needsCode ? t('auth.verify') : t('auth.create')}
          onPress={() => void (needsCode ? verify() : submit())}
          disabled={busy || (!needsCode && (!emailAddress || !password)) || (needsCode && !code)}
          loading={busy}
          testID="submit-sign-up"
        />
        {needsCode ? (
          <Pressable onPress={() => void signUp.verifications.sendEmailCode()}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.resend')}</Text>
          </Pressable>
        ) : null}
        <View nativeID="clerk-captcha" />
        <View style={styles.footer}>
          <Text style={{ color: colors.mutedForeground }}>{t('auth.haveAccount')} </Text>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable><Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.signInLink')}</Text></Pressable>
          </Link>
        </View>
      </KeyboardAwareScrollViewCompat>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 13 },
  brand: { textAlign: 'center', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '700' },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, fontSize: 16 },
  error: { fontSize: 13, lineHeight: 18 },
  linkText: { fontSize: 14, fontWeight: '700', textAlign: 'center', padding: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
});
