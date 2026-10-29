import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSignIn } from '@clerk/expo';
import { ActionButton, Screen } from '@/components/LearningUI';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useLanguage } from '@/context/LanguageContext';
import { translate } from '@/lib/i18n';
import {
  requestPasswordResetCode,
  submitPasswordReset,
  verifyPasswordResetCode,
} from '@/lib/passwordResetFlow';
import { useColors } from '@/hooks/useColors';

export default function SignInScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();
  const { language } = useLanguage();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [needsCode, setNeedsCode] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<
    'none' | 'request' | 'code' | 'new-password'
  >('none');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const t = (key: string, values?: Record<string, string | number>) =>
    translate(language, key, values);
  const busy = fetchStatus === 'fetching';
  const isRecovering = recoveryStep !== 'none';

  const finish = () =>
    signIn.finalize({
      navigate: ({ session }) => {
        if (session?.currentTask) return;
        router.replace('/(tabs)');
      },
    });

  const submit = async () => {
    setError('');
    try {
      const result = await signIn.password({ emailAddress, password });
      if (result.error) {
        setError(result.error.message || t('auth.genericError'));
        return;
      }
      if (signIn.status === 'complete') {
        await finish();
      } else if (signIn.status === 'needs_client_trust') {
        const factor = signIn.supportedSecondFactors.find((item) => item.strategy === 'email_code');
        if (factor) {
          await signIn.mfa.sendEmailCode();
          setNeedsCode(true);
        } else {
          setError(t('auth.genericError'));
        }
      }
    } catch {
      setError(t('auth.genericError'));
    }
  };

  const verify = async () => {
    setError('');
    try {
      const result = await signIn.mfa.verifyEmailCode({ code });
      if (result.error) {
        setError(result.error.message || t('auth.genericError'));
        return;
      }
      if (signIn.status === 'complete') await finish();
    } catch {
      setError(t('auth.genericError'));
    }
  };

  const startRecovery = () => {
    setError('');
    setNotice('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setRecoveryStep('request');
  };

  const returnToSignIn = async () => {
    setError('');
    setNotice('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setNeedsCode(false);
    setRecoveryStep('none');
    await signIn.reset();
  };

  const requestResetCode = async () => {
    setError('');
    setNotice('');
    try {
      const result = await requestPasswordResetCode({
        signIn,
        emailAddress,
        genericError: t('auth.genericError'),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setRecoveryStep('code');
      setNotice(t('auth.resetCodeSent'));
    } catch {
      setError(t('auth.genericError'));
    }
  };

  const verifyResetCode = async () => {
    setError('');
    setNotice('');
    try {
      const result = await verifyPasswordResetCode({
        signIn,
        code,
        invalidCodeError: t('auth.resetCodeError'),
      });
      if (result.error) {
        setError(result.error);
      } else {
        setRecoveryStep('new-password');
      }
    } catch {
      setError(t('auth.resetCodeError'));
    }
  };

  const saveNewPassword = async () => {
    setError('');
    setNotice('');
    if (newPassword !== confirmPassword) {
      setError(t('auth.resetPasswordMismatch'));
      return;
    }

    try {
      const result = await submitPasswordReset({
        signIn,
        password: newPassword,
        genericError: t('auth.genericError'),
      });
      if (result.error) {
        setError(result.error);
        return;
      }

      await signIn.reset();
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCode('');
      setRecoveryStep('none');
      setNotice(t('auth.resetSuccess'));
    } catch {
      setError(t('auth.genericError'));
    }
  };

  const resendResetCode = async () => {
    setError('');
    setNotice('');
    try {
      const result = await signIn.resetPasswordEmailCode.sendCode();
      if (result.error) {
        setError(result.error.message || t('auth.genericError'));
        return;
      }
      setNotice(t('auth.resetCodeSent'));
    } catch {
      setError(t('auth.genericError'));
    }
  };

  const screenTitle = isRecovering
    ? recoveryStep === 'request'
      ? t('auth.resetRequestTitle')
      : recoveryStep === 'code'
        ? t('auth.resetCodeTitle')
        : t('auth.resetPasswordTitle')
    : needsCode
      ? t('auth.verifyTitle')
      : t('auth.signIn');
  const screenDescription = isRecovering
    ? recoveryStep === 'request'
      ? t('auth.resetRequestInstructions')
      : recoveryStep === 'code'
      ? t('auth.resetCodeInstructions', { email: emailAddress })
        : t('auth.resetPasswordInstructions')
    : '';

  return (
    <Screen>
      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={styles.content}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.brand, { color: colors.primary }]}>{t('app.name')}</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{screenTitle}</Text>
        {screenDescription ? (
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            {screenDescription}
          </Text>
        ) : null}
        {(!isRecovering && !needsCode) || recoveryStep === 'request' ? (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>{t('auth.email')}</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              value={emailAddress}
              onChangeText={setEmailAddress}
              placeholder={t('auth.email')}
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </>
        ) : null}
        {!isRecovering && !needsCode ? (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>{t('auth.password')}</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.password')}
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoComplete="current-password"
            />
          </>
        ) : null}
        {!isRecovering && needsCode ? (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>{t('auth.code')}</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              value={code}
              onChangeText={setCode}
              placeholder={t('auth.code')}
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              keyboardType="number-pad"
              autoComplete="one-time-code"
            />
          </>
        ) : null}
        {isRecovering && recoveryStep === 'code' ? (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>{t('auth.code')}</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              value={code}
              onChangeText={setCode}
              placeholder={t('auth.code')}
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
            />
          </>
        ) : null}
        {isRecovering && recoveryStep === 'new-password' ? (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>{t('auth.newPassword')}</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t('auth.newPassword')}
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <Text style={[styles.label, { color: colors.foreground }]}>{t('auth.confirmNewPassword')}</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('auth.confirmNewPassword')}
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
            />
          </>
        ) : null}
        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        {notice ? <Text accessibilityRole="status" style={[styles.notice, { color: colors.primary }]}>{notice}</Text> : null}
        <ActionButton
          label={
            busy
              ? t('auth.loading')
              : isRecovering
                ? recoveryStep === 'request'
                  ? t('auth.sendResetCode')
                  : recoveryStep === 'code'
                    ? t('auth.verifyResetCode')
                    : t('auth.saveNewPassword')
                : needsCode
                  ? t('auth.verify')
                  : t('auth.signIn')
          }
          onPress={() =>
            void (isRecovering
              ? recoveryStep === 'request'
                ? requestResetCode()
                : recoveryStep === 'code'
                  ? verifyResetCode()
                  : saveNewPassword()
              : needsCode
                ? verify()
                : submit())
          }
          disabled={
            busy ||
            (isRecovering && recoveryStep === 'request' && !emailAddress.trim()) ||
            (isRecovering && recoveryStep === 'code' && !code.trim()) ||
            (isRecovering &&
              recoveryStep === 'new-password' &&
              (!newPassword || !confirmPassword)) ||
            (!isRecovering && !needsCode && (!emailAddress || !password)) ||
            (!isRecovering && needsCode && !code)
          }
          loading={busy}
          testID="submit-sign-in"
        />
        {!isRecovering && needsCode ? (
          <Pressable onPress={() => void signIn.mfa.sendEmailCode()}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.resend')}</Text>
          </Pressable>
        ) : null}
        {isRecovering && recoveryStep === 'code' ? (
          <Pressable onPress={() => void resendResetCode()} disabled={busy}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.resend')}</Text>
          </Pressable>
        ) : null}
        {isRecovering || needsCode ? (
          <Pressable onPress={() => void returnToSignIn()} disabled={busy} testID="return-to-sign-in">
            <Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.backToSignIn')}</Text>
          </Pressable>
        ) : (
          <>
            <Pressable onPress={startRecovery} disabled={busy} testID="forgot-password">
              <Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.forgotPassword')}</Text>
            </Pressable>
            <View style={styles.footer}>
              <Text style={{ color: colors.mutedForeground }}>{t('auth.needAccount')} </Text>
              <Link href="/(auth)/sign-up" asChild>
                <Pressable><Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.signUpLink')}</Text></Pressable>
              </Link>
            </View>
          </>
        )}
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
  description: { fontSize: 15, lineHeight: 22 },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, fontSize: 16 },
  error: { fontSize: 13, lineHeight: 18 },
  notice: { fontSize: 13, lineHeight: 18 },
  linkText: { fontSize: 14, fontWeight: '700', textAlign: 'center', padding: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
});
