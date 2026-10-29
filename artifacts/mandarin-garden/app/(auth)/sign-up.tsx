import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useSignUp } from '@clerk/expo';
import { ActionButton, Screen } from '@/components/LearningUI';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useLanguage } from '@/context/LanguageContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import {
  finalizeParentSession,
  getSignUpAction,
  submitEmailPasswordSignUp,
  verifyEmailSignUpCode,
} from '@/lib/signUpFlow';

export default function SignUpScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();
  const { continueOAuth } = useLocalSearchParams<{ continueOAuth?: string }>();
  const { language } = useLanguage();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [needsCode, setNeedsCode] = useState(false);
  const [requiredValues, setRequiredValues] = useState<Record<string, string>>({});
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [verificationField, setVerificationField] = useState<
    'email_address' | 'phone_number' | null
  >(null);
  const [error, setError] = useState('');
  const t = (key: string) => translate(language, key);
  const busy = fetchStatus === 'fetching';
  const isOAuthContinuation = continueOAuth === '1';
  const continuationFields = isOAuthContinuation
    ? signUp.missingFields.filter(
        (field) =>
          field !== 'protect_check' &&
          field !== 'enterprise_sso' &&
          !field.startsWith('oauth_'),
      )
    : [];
  const isVerifying = needsCode || verificationField !== null;

  const finish = () => finalizeParentSession(signUp, () => router.replace('/(tabs)'));

  const sendOAuthVerification = async (
    field: 'email_address' | 'phone_number',
  ) => {
    const { error: sendError } =
      field === 'email_address'
        ? await signUp.verifications.sendEmailCode()
        : await signUp.verifications.sendPhoneCode();
    if (sendError) {
      setError(sendError.message || t('auth.genericError'));
      return;
    }
    setVerificationField(field);
    setCode('');
  };

  const continueGoogleSignUp = async () => {
    setError('');
    try {
      const updateValues = Object.fromEntries(
        continuationFields.map((field) => [
          field.replace(/([-_][a-z])/g, (match) =>
            match.toUpperCase().replace(/-|_/, ''),
          ),
          field === 'legal_accepted'
            ? legalAccepted
            : requiredValues[field]?.trim() ?? '',
        ]),
      ) as Parameters<typeof signUp.update>[0];
      const { error: updateError } = await signUp.update(updateValues);
      if (updateError) {
        setError(updateError.message || t('auth.genericError'));
        return;
      }

      if (signUp.status === 'complete') {
        await finish();
        return;
      }

      const nextVerification = signUp.unverifiedFields.find(
        (field) => field === 'email_address' || field === 'phone_number',
      );
      if (nextVerification) {
        await sendOAuthVerification(nextVerification);
        return;
      }

      setError(t('auth.continueError'));
    } catch {
      setError(t('auth.genericError'));
    }
  };

  const submit = async () => {
    await submitEmailPasswordSignUp({
      signUp,
      emailAddress,
      password,
      finish,
      setNeedsCode,
      setError,
      genericError: t('auth.genericError'),
    });
  };

  const verify = async () => {
    if (!isOAuthContinuation) {
      await verifyEmailSignUpCode({
        signUp,
        code,
        finish,
        setError,
        genericError: t('auth.genericError'),
      });
      return;
    }

    setError('');
    try {
      const result = verificationField === 'phone_number'
        ? await signUp.verifications.verifyPhoneCode({ code })
        : await signUp.verifications.verifyEmailCode({ code });
      if (result.error) {
        setError(result.error.message || t('auth.genericError'));
        return;
      }
      if (signUp.status === 'complete') {
        await finish();
        return;
      }
      if (isOAuthContinuation) {
        setVerificationField(null);
        const nextVerification = signUp.unverifiedFields.find(
          (field) => field === 'email_address' || field === 'phone_number',
        );
        if (nextVerification) await sendOAuthVerification(nextVerification);
      }
    } catch {
      setError(t('auth.genericError'));
    }
  };

  const fieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      first_name: t('auth.firstName'),
      last_name: t('auth.lastName'),
      username: t('auth.username'),
      email_address: t('auth.email'),
      phone_number: t('auth.phone'),
      legal_accepted: t('auth.legalAccepted'),
    };
    return (
      labels[field] ??
      field.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
    );
  };
  const canContinueOAuth = continuationFields.every((field) =>
    field === 'legal_accepted'
      ? legalAccepted
      : Boolean(requiredValues[field]?.trim()),
  );

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
          {isOAuthContinuation
            ? isVerifying
              ? t('auth.verifyTitle')
              : t('auth.completeSignUp')
            : needsCode
              ? t('auth.verifyTitle')
              : t('auth.createAccount')}
        </Text>
        {isOAuthContinuation && !isVerifying ? (
          <>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {t('auth.completeSignUpDescription')}
            </Text>
            {continuationFields.map((field) =>
              field === 'legal_accepted' ? (
                <Pressable
                  key={field}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: legalAccepted }}
                  onPress={() => setLegalAccepted((accepted) => !accepted)}
                  style={styles.legalRow}
                  testID="signup-required-legal-accepted"
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: colors.border,
                        backgroundColor: legalAccepted
                          ? colors.primary
                          : colors.card,
                      },
                    ]}
                  >
                    {legalAccepted ? (
                      <Text style={{ color: colors.primaryForeground }}>✓</Text>
                    ) : null}
                  </View>
                  <Text style={[styles.label, styles.legalText, { color: colors.foreground }]}>
                    {fieldLabel(field)}
                  </Text>
                </Pressable>
              ) : (
                <View key={field} style={styles.field}>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    {fieldLabel(field)}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.foreground,
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    value={requiredValues[field] ?? ''}
                    onChangeText={(value) =>
                      setRequiredValues((current) => ({
                        ...current,
                        [field]: value,
                      }))
                    }
                    placeholder={fieldLabel(field)}
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize={
                      field === 'username' ||
                      field === 'email_address' ||
                      field === 'phone_number'
                        ? 'none'
                        : 'words'
                    }
                    keyboardType={
                      field === 'email_address'
                        ? 'email-address'
                        : field === 'phone_number'
                          ? 'phone-pad'
                          : 'default'
                    }
                    testID={`signup-required-${field}`}
                  />
                </View>
              ),
            )}
          </>
        ) : isVerifying ? (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>
              {verificationField === 'phone_number'
                ? t('auth.phoneCode')
                : t('auth.code')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              value={code}
              onChangeText={setCode}
              placeholder={
                verificationField === 'phone_number'
                  ? t('auth.phoneCode')
                  : t('auth.code')
              }
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              testID="signup-verification-code"
            />
          </>
        ) : (
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
            />
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
        )}
        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        <ActionButton
          label={
            busy
              ? t('auth.loading')
              : isVerifying
                ? t('auth.verify')
                : isOAuthContinuation
                  ? t('auth.continue')
                  : t('auth.create')
          }
          onPress={() => {
            const action = getSignUpAction({ isOAuthContinuation, isVerifying });
            if (action === 'verify') void verify();
            else if (action === 'continue-google') void continueGoogleSignUp();
            else void submit();
          }}
          disabled={
            busy ||
            (isVerifying && !code) ||
            (isOAuthContinuation && !isVerifying && !canContinueOAuth) ||
            (!isOAuthContinuation && !isVerifying && (!emailAddress || !password))
          }
          loading={busy}
          testID={isOAuthContinuation ? 'continue-google-sign-up' : 'submit-sign-up'}
        />
        {needsCode ? (
          <Pressable onPress={() => void signUp.verifications.sendEmailCode()}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.resend')}</Text>
          </Pressable>
        ) : null}
        {isOAuthContinuation && verificationField ? (
          <Pressable onPress={() => void sendOAuthVerification(verificationField)}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.resend')}</Text>
          </Pressable>
        ) : null}
        <View nativeID="clerk-captcha" />
        {!isOAuthContinuation ? (
          <View style={styles.footer}>
            <Text style={{ color: colors.mutedForeground }}>{t('auth.haveAccount')} </Text>
            <Link href="/(auth)/sign-in" asChild>
              <Pressable><Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.signInLink')}</Text></Pressable>
            </Link>
          </View>
        ) : null}
      </KeyboardAwareScrollViewCompat>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 13 },
  brand: { textAlign: 'center', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 20 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700' },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, fontSize: 16 },
  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  legalText: { flex: 1 },
  checkbox: { width: 24, height: 24, borderWidth: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: 13, lineHeight: 18 },
  linkText: { fontSize: 14, fontWeight: '700', textAlign: 'center', padding: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
});
