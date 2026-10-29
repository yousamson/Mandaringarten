import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useUser } from '@clerk/react';
import { RotateCcw, ShieldCheck } from 'lucide-react';
import { AdultConfirmation, ConsentCheck, DisclaimerAgreement, PrivacyAgreement } from './consent-check';
import { clearAuthConsent, readAuthConsent, useAcceptConsent, useAccountConsent } from '@/hooks/use-consent';
import type { Language } from '@/lib/garden-data';
import { LEGAL_VERSION } from '@/lib/legal-config';
import { tr } from '@/lib/playground-copy';

/** Blocks account features for signed-in parents until this account has accepted the current policies. */
export function AccountConsentBoundary({ language, children }: { language: Language; children: ReactNode }) {
  const { isSignedIn, isLoaded, user } = useUser();
  if (!isLoaded || !isSignedIn) return <>{children}</>;
  return <SignedInConsent key={user?.id} l={language}>{children}</SignedInConsent>;
}

function SignedInConsent({ l, children }: { l: Language; children: ReactNode }) {
  const { uid, query, accepted } = useAccountConsent();
  const { accept, isPending, isError } = useAcceptConsent(uid);
  const acceptRef = useRef(accept);
  acceptRef.current = accept;
  const synced = useRef<string | null>(null);
  const [privacy, setPrivacy] = useState(false);
  const [disclaimer, setDisclaimer] = useState(false);
  const [adult, setAdult] = useState(false);

  // Consent explicitly given on the pre-auth gate (this tab, this attempt) is recorded once on the account.
  const hasData = Boolean(query.data);
  useEffect(() => {
    if (accepted) { clearAuthConsent(); return; }
    if (!uid || !hasData || accepted || synced.current === uid) return;
    if (readAuthConsent()) {
      synced.current = uid;
      acceptRef.current();
    }
  }, [uid, hasData, accepted]);

  if (accepted) return <>{children}</>;

  if (query.isLoading || (isPending && synced.current === uid)) {
    return (
      <main className="page-shell"><div className="consent-shell">
        <div className="skeleton-line w40" /><div className="skeleton-line w80" /><div className="skeleton-block" />
        <p className="panel-desc" role="status">{tr(l, 'Checking your account agreements…', '正在確認帳戶同意紀錄…', '正在确认账户同意记录…')}</p>
      </div></main>
    );
  }
  if (query.isError) {
    return (
      <main className="page-shell"><div className="consent-shell">
        <div className="alert" role="alert">{tr(l, 'We could not check your account agreements.', '無法確認帳戶同意紀錄。', '无法确认账户同意记录。')}</div>
        <button className="button-secondary" onClick={() => void query.refetch()} data-testid="button-retry-consent"><RotateCcw size={14} /> {tr(l, 'Try again', '再試一次', '再试一次')}</button>
      </div></main>
    );
  }

  const ready = privacy && disclaimer && adult;
  return (
    <main className="page-shell">
      <section className="consent-shell reveal" aria-labelledby="consent-title">
        <span className="consent-seal"><ShieldCheck size={24} /></span>
        <div className="eyebrow">{tr(l, `Policies · version ${LEGAL_VERSION}`, `政策 · 版本 ${LEGAL_VERSION}`, `政策 · 版本 ${LEGAL_VERSION}`)}</div>
        <h1 id="consent-title">{tr(l, 'One quick agreement before you continue.', '繼續之前，請先確認同意事項。', '继续之前，请先确认同意事项。')}</h1>
        <p className="panel-desc">{tr(l, 'Your account has not yet accepted the current policies. Account features stay paused until you do.', '您的帳戶尚未接受目前版本的政策。在確認之前，帳戶功能將暫停使用。', '您的账户尚未接受当前版本的政策。在确认之前，账户功能将暂停使用。')}</p>
        <div className="consent-list">
          <ConsentCheck checked={privacy} onChange={setPrivacy} testId="check-account-privacy"><PrivacyAgreement l={l} /></ConsentCheck>
          <ConsentCheck checked={disclaimer} onChange={setDisclaimer} testId="check-account-disclaimer"><DisclaimerAgreement l={l} /></ConsentCheck>
          <ConsentCheck checked={adult} onChange={setAdult} testId="check-account-adult"><AdultConfirmation l={l} /></ConsentCheck>
        </div>
        {isError ? <div className="alert" role="alert">{tr(l, 'We could not save your agreement. Please try again.', '無法儲存同意紀錄，請再試一次。', '无法保存同意记录，请再试一次。')}</div> : null}
        <button className="button-primary" disabled={!ready || isPending} onClick={() => accept()} data-testid="button-accept-consent">
          {isPending ? tr(l, 'Saving…', '儲存中…', '保存中…') : tr(l, 'Agree and continue', '同意並繼續', '同意并继续')}
        </button>
      </section>
    </main>
  );
}
