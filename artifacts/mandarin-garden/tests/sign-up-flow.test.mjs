import assert from 'node:assert/strict';
import test from 'node:test';
import {
  finalizeParentSession,
  getSignUpAction,
  submitEmailPasswordSignUp,
  verifyEmailSignUpCode,
} from '../lib/signUpFlow.ts';

function makeSignUp(overrides = {}) {
  const calls = [];
  const signUp = {
    status: 'missing_requirements',
    unverifiedFields: ['email_address'],
    async password(input) {
      calls.push(['password', input]);
      return {};
    },
    verifications: {
      async sendEmailCode() {
        calls.push(['sendEmailCode']);
        return {};
      },
      async verifyEmailCode(input) {
        calls.push(['verifyEmailCode', input]);
        return {};
      },
    },
    async finalize(options) {
      calls.push(['finalize', options]);
      return options;
    },
    ...overrides,
  };
  return { signUp, calls };
}

test('ordinary signup selects email/password, while Google continuation stays separate', () => {
  assert.equal(
    getSignUpAction({ isOAuthContinuation: false, isVerifying: false }),
    'submit-email',
  );
  assert.equal(
    getSignUpAction({ isOAuthContinuation: true, isVerifying: false }),
    'continue-google',
  );
  assert.equal(
    getSignUpAction({ isOAuthContinuation: true, isVerifying: true }),
    'verify',
  );
});

test('email/password signup requests an email code for an unverified address', async () => {
  const { signUp, calls } = makeSignUp();
  let needsCode = false;
  const errors = [];

  await submitEmailPasswordSignUp({
    signUp,
    emailAddress: 'parent@example.com',
    password: 'a-strong-password',
    finish: () => calls.push(['finish']),
    setNeedsCode: (value) => { needsCode = value; },
    setError: (message) => errors.push(message),
    genericError: 'Could not sign up',
  });

  assert.deepEqual(calls, [
    ['password', { emailAddress: 'parent@example.com', password: 'a-strong-password' }],
    ['sendEmailCode'],
  ]);
  assert.equal(needsCode, true);
  assert.deepEqual(errors, ['']);
});

test('email-code verification finalizes the parent session and navigates to member tabs', async () => {
  const { signUp, calls } = makeSignUp({ status: 'complete' });
  let navigatedToTabs = false;
  const finish = () =>
    finalizeParentSession(signUp, () => { navigatedToTabs = true; });

  await verifyEmailSignUpCode({
    signUp,
    code: '123456',
    finish,
    setError: () => {},
    genericError: 'Could not verify email',
  });

  assert.deepEqual(calls.map(([name, value]) => [
    name,
    name === 'verifyEmailCode' ? value : undefined,
  ]), [
    ['verifyEmailCode', { code: '123456' }],
    ['finalize', undefined],
  ]);
  const finalizeOptions = calls.find(([name]) => name === 'finalize')[1];
  finalizeOptions.navigate({ session: {} });
  assert.equal(navigatedToTabs, true);
});

test('session finalization leaves Clerk follow-up tasks in control of navigation', async () => {
  const { signUp, calls } = makeSignUp();
  let navigatedToTabs = false;
  await finalizeParentSession(signUp, () => { navigatedToTabs = true; });

  calls.find(([name]) => name === 'finalize')[1].navigate({
    session: { currentTask: { action: 'setup' } },
  });
  assert.equal(navigatedToTabs, false);
});
