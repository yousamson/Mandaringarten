type ClerkError = { message?: string };

type SignUpFlowClient = {
  status: string;
  unverifiedFields: string[];
  password: (input: { emailAddress: string; password: string }) => Promise<{
    error?: ClerkError | null;
  }>;
  verifications: {
    sendEmailCode: () => Promise<{ error?: ClerkError | null }>;
    verifyEmailCode: (input: { code: string }) => Promise<{
      error?: ClerkError | null;
    }>;
  };
  finalize: (options: {
    navigate: (input: { session?: { currentTask?: unknown } | null }) => void;
  }) => Promise<unknown> | unknown;
};

export function getSignUpAction({
  isOAuthContinuation,
  isVerifying,
}: {
  isOAuthContinuation: boolean;
  isVerifying: boolean;
}): 'verify' | 'continue-google' | 'submit-email' {
  if (isVerifying) return 'verify';
  return isOAuthContinuation ? 'continue-google' : 'submit-email';
}

export function finalizeParentSession(
  signUp: Pick<SignUpFlowClient, 'finalize'>,
  replaceWithMemberTabs: () => void,
) {
  return signUp.finalize({
    navigate: ({ session }) => {
      if (session?.currentTask) return;
      replaceWithMemberTabs();
    },
  });
}

export async function submitEmailPasswordSignUp({
  signUp,
  emailAddress,
  password,
  finish,
  setNeedsCode,
  setError,
  genericError,
}: {
  signUp: Pick<
    SignUpFlowClient,
    'status' | 'unverifiedFields' | 'password' | 'verifications'
  >;
  emailAddress: string;
  password: string;
  finish: () => Promise<unknown> | unknown;
  setNeedsCode: (needsCode: boolean) => void;
  setError: (message: string) => void;
  genericError: string;
}) {
  setError('');
  try {
    const result = await signUp.password({ emailAddress, password });
    if (result.error) {
      setError(result.error.message || genericError);
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
    setError(genericError);
  }
}

export async function verifyEmailSignUpCode({
  signUp,
  code,
  finish,
  setError,
  genericError,
}: {
  signUp: Pick<SignUpFlowClient, 'status' | 'verifications'>;
  code: string;
  finish: () => Promise<unknown> | unknown;
  setError: (message: string) => void;
  genericError: string;
}) {
  setError('');
  try {
    const result = await signUp.verifications.verifyEmailCode({ code });
    if (result.error) {
      setError(result.error.message || genericError);
      return;
    }
    if (signUp.status === 'complete') await finish();
  } catch {
    setError(genericError);
  }
}
