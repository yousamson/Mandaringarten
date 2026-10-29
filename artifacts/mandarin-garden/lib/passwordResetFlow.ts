type ClerkError = { message?: string } | null;

export type PasswordResetClient = {
  create: (params: { identifier: string }) => Promise<{ error: ClerkError }>;
  resetPasswordEmailCode: {
    sendCode: () => Promise<{ error: ClerkError }>;
    verifyCode: (params: { code: string }) => Promise<{ error: ClerkError }>;
    submitPassword: (params: { password: string }) => Promise<{ error: ClerkError }>;
  };
};

export async function requestPasswordResetCode({
  signIn,
  emailAddress,
  genericError,
}: {
  signIn: PasswordResetClient;
  emailAddress: string;
  genericError: string;
}): Promise<{ error: string | null }> {
  try {
    const created = await signIn.create({ identifier: emailAddress.trim() });
    if (created.error) return { error: created.error.message || genericError };

    const sent = await signIn.resetPasswordEmailCode.sendCode();
    if (sent.error) return { error: sent.error.message || genericError };
    return { error: null };
  } catch {
    return { error: genericError };
  }
}

export async function verifyPasswordResetCode({
  signIn,
  code,
  invalidCodeError,
}: {
  signIn: PasswordResetClient;
  code: string;
  invalidCodeError: string;
}): Promise<{ error: string | null }> {
  try {
    const result = await signIn.resetPasswordEmailCode.verifyCode({
      code: code.trim(),
    });
    return { error: result.error ? invalidCodeError : null };
  } catch {
    return { error: invalidCodeError };
  }
}

export async function submitPasswordReset({
  signIn,
  password,
  genericError,
}: {
  signIn: PasswordResetClient;
  password: string;
  genericError: string;
}): Promise<{ error: string | null }> {
  try {
    const result = await signIn.resetPasswordEmailCode.submitPassword({ password });
    return { error: result.error?.message || (result.error ? genericError : null) };
  } catch {
    return { error: genericError };
  }
}
