import assert from 'node:assert/strict';
import test from 'node:test';
import {
  requestPasswordResetCode,
  submitPasswordReset,
  verifyPasswordResetCode,
} from '../lib/passwordResetFlow.ts';
import { translate } from '../lib/i18n.ts';

function makeSignIn(overrides = {}) {
  const calls = [];
  const signIn = {
    async create(input) {
      calls.push(['create', input]);
      return {};
    },
    resetPasswordEmailCode: {
      async sendCode() {
        calls.push(['sendCode']);
        return {};
      },
      async verifyCode(input) {
        calls.push(['verifyCode', input]);
        return {};
      },
      async submitPassword(input) {
        calls.push(['submitPassword', input]);
        return {};
      },
    },
    ...overrides,
  };
  return { signIn, calls };
}

test('password recovery sends an email code for the trimmed address', async () => {
  const { signIn, calls } = makeSignIn();
  const result = await requestPasswordResetCode({
    signIn,
    emailAddress: ' parent@example.com ',
    genericError: 'Could not send code',
  });

  assert.deepEqual(result, { error: null });
  assert.deepEqual(calls, [
    ['create', { identifier: 'parent@example.com' }],
    ['sendCode'],
  ]);
});

test('invalid or expired reset codes return the localized recovery error', async () => {
  const { signIn, calls } = makeSignIn({
    resetPasswordEmailCode: {
      async sendCode() {
        return {};
      },
      async verifyCode(input) {
        calls.push(['verifyCode', input]);
        return { error: { message: 'Clerk internal message' } };
      },
      async submitPassword() {
        return {};
      },
    },
  });

  const result = await verifyPasswordResetCode({
    signIn,
    code: ' 123456 ',
    invalidCodeError: 'That code is invalid or has expired.',
  });

  assert.deepEqual(result, { error: 'That code is invalid or has expired.' });
  assert.deepEqual(calls, [['verifyCode', { code: '123456' }]]);
});

test('a verified parent can submit the new password', async () => {
  const { signIn, calls } = makeSignIn();
  const result = await submitPasswordReset({
    signIn,
    password: 'new-strong-password',
    genericError: 'Could not update password',
  });

  assert.deepEqual(result, { error: null });
  assert.deepEqual(calls, [
    ['submitPassword', { password: 'new-strong-password' }],
  ]);
});

test('password reset request errors stay visible to the parent', async () => {
  const { signIn } = makeSignIn({
    async create() {
      return { error: { message: 'Email address is invalid' } };
    },
  });

  const result = await requestPasswordResetCode({
    signIn,
    emailAddress: 'not-an-email',
    genericError: 'Could not send code',
  });

  assert.deepEqual(result, { error: 'Email address is invalid' });
});

test('password recovery prompts are translated and include the target email', () => {
  for (const language of ['en', 'zh-Hant', 'zh-Hans']) {
    const instructions = translate(language, 'auth.resetCodeInstructions', {
      email: 'parent@example.com',
    });
    assert.ok(instructions.includes('parent@example.com'));
    assert.notEqual(instructions, 'auth.resetCodeInstructions');
    assert.notEqual(translate(language, 'auth.resetCodeError'), 'auth.resetCodeError');
    assert.notEqual(translate(language, 'auth.resetSuccess'), 'auth.resetSuccess');
  }
});
