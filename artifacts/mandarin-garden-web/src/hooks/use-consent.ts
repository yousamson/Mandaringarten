import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/react';
import { getGetLegalConsentQueryKey, useAcceptLegalConsent, useGetLegalConsent } from '@workspace/api-client-react';
import { LEGAL_VERSION } from '@/lib/legal-config';

const AUTH_CONSENT_KEY = 'mg-auth-consent';

/** Consent given on the gate before Clerk renders; valid only for this tab's current auth attempt. */
export function readAuthConsent(forRegistration = false): boolean {
  try {
    const raw = sessionStorage.getItem(AUTH_CONSENT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { version?: string; privacy?: boolean; disclaimer?: boolean; adult?: boolean; subscription?: boolean };
    return parsed.version === LEGAL_VERSION && parsed.privacy === true && parsed.disclaimer === true && parsed.adult === true &&
      (!forRegistration || parsed.subscription === true);
  } catch {
    return false;
  }
}
export function writeAuthConsent(subscription = false) {
  try {
    sessionStorage.setItem(AUTH_CONSENT_KEY, JSON.stringify({ version: LEGAL_VERSION, privacy: true, disclaimer: true, adult: true, subscription, at: new Date().toISOString() }));
  } catch { /* if storage is blocked the gate simply shows again */ }
}
export function clearAuthConsent() {
  try { sessionStorage.removeItem(AUTH_CONSENT_KEY); } catch { /* ignore */ }
}

export const consentQueryKey = (uid: string | null) => [...getGetLegalConsentQueryKey(), uid];

export function useAccountConsent() {
  const { isSignedIn, user } = useUser();
  const uid = user?.id ?? null;
  const query = useGetLegalConsent({
    query: { enabled: Boolean(isSignedIn && uid), queryKey: consentQueryKey(uid), retry: 1, refetchOnWindowFocus: true },
  });
  const accepted = query.data?.accepted === true && query.data.policyVersion === LEGAL_VERSION;
  return { uid, query, accepted };
}

export function useAcceptConsent(uid: string | null) {
  const client = useQueryClient();
  const mutation = useAcceptLegalConsent();
  const accept = (callbacks?: { onError?: () => void }) => {
    mutation.mutate(
      { data: { privacyAccepted: true, disclaimerAccepted: true, adultConfirmed: true, policyVersion: LEGAL_VERSION } },
      {
        onSuccess: (result) => {
          clearAuthConsent();
          client.setQueryData(consentQueryKey(uid), result);
          void client.invalidateQueries({ queryKey: consentQueryKey(uid) });
        },
        onError: () => callbacks?.onError?.(),
      },
    );
  };
  return { accept, isPending: mutation.isPending, isError: mutation.isError };
}
