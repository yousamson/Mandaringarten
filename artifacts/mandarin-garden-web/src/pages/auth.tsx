import { useState } from 'react';
import { SignIn, SignUp, useUser } from '@clerk/react';
import { ArrowRight, KeyRound, Sprout } from 'lucide-react';
import { Link } from 'wouter';
import { AdultConfirmation, ConsentCheck, DisclaimerAgreement, PrivacyAgreement } from '@/components/legal/consent-check';
import { readAuthConsent, writeAuthConsent } from '@/hooks/use-consent';
import type { Language } from '@/lib/garden-data';
import { LEGAL_VERSION } from '@/lib/legal-config';
import { tr } from '@/lib/playground-copy';

type Mode = 'sign-in' | 'register';

/** Consent gate rendered BEFORE any Clerk component, for both sign-in and registration. */
export default function AuthPage({ mode, language: l }: { mode: Mode; language: Language }) {
  const { isLoaded, isSignedIn } = useUser();
  const [consented, setConsented] = useState(() => mode !== 'register' || readAuthConsent(true));
  const [privacy, setPrivacy] = useState(false);
  const [disclaimer, setDisclaimer] = useState(false);
  const [adult, setAdult] = useState(false);
  const [subscription, setSubscription] = useState(false);
  const isRegister = mode === 'register';

  if (isLoaded && isSignedIn) {
    return (
      <main className="page-shell"><section className="auth-stage">
        <div className="auth-intro"><div className="eyebrow">{tr(l, 'Signed in', '已登入', '已登录')}</div><h1>{tr(l, 'You are already in the garden.', '您已經在樂園裡了。', '您已经在乐园里了。')}</h1>
          <Link href="/parent" className="button-primary" data-testid="link-go-parent">{tr(l, 'Go to For parents', '前往家長專區', '前往家长专区')} <ArrowRight size={15} /></Link></div>
      </section></main>
    );
  }

  const ready = privacy && disclaimer && adult && (!isRegister || subscription);
  const proceed = () => { if (!ready) return; writeAuthConsent(isRegister); setConsented(true); };

  return (
    <main className="page-shell">
      <section className="auth-stage">
        <div className="auth-intro reveal">
          <span className="consent-seal">{isRegister ? <Sprout size={24} /> : <KeyRound size={22} />}</span>
          <div className="eyebrow">{isRegister ? tr(l, 'Create a parent account', '建立家長帳戶', '创建家长账户') : tr(l, 'Parent sign in', '家長登入', '家长登录')}</div>
          <h1>{isRegister ? tr(l, 'A garden account, held by a grown-up.', '由大人保管的樂園帳戶。', '由大人保管的乐园账户。') : tr(l, 'Welcome back to the garden.', '歡迎回到樂園。', '欢迎回到乐园。')}</h1>
          <p>{tr(l, 'Accounts are for parents and guardians. Children play beside you, on your account.', '帳戶僅供家長與監護人使用，孩子在您身邊、用您的帳戶學習。', '账户仅供家长与监护人使用，孩子在您身边、用您的账户学习。')}{isRegister ? tr(l, ' Signed-in use needs a paid membership; the free lessons stay open without an account.', ' 登入後使用需付費會員；免費課程無需帳戶即可使用。', ' 登录后使用需付费会员；免费课程无需账户即可使用。') : null}</p>
          <div className="auth-switch">
            {isRegister
              ? <>{tr(l, 'Already have an account?', '已經有帳戶？', '已经有账户？')} <Link href="/sign-in" className="doc-link" data-testid="link-to-sign-in">{tr(l, 'Sign in', '登入', '登录')}</Link></>
              : <>{tr(l, 'New here?', '第一次來？', '第一次来？')} <Link href="/register" className="doc-link" data-testid="link-to-register">{tr(l, 'Create an account', '建立帳戶', '创建账户')}</Link></>}
          </div>
        </div>
        <div className="auth-panel">
          {isRegister && !consented ? (
            <div className="consent-card" data-testid="auth-consent-gate">
              <div className="eyebrow">{tr(l, `Before you continue · v${LEGAL_VERSION}`, `繼續之前 · 版本 ${LEGAL_VERSION}`, `继续之前 · 版本 ${LEGAL_VERSION}`)}</div>
              <h2>{tr(l, 'Please confirm each item.', '請逐項確認。', '请逐项确认。')}</h2>
              <div className="consent-list">
                <ConsentCheck checked={privacy} onChange={setPrivacy} testId="check-auth-privacy"><PrivacyAgreement l={l} /></ConsentCheck>
                <ConsentCheck checked={disclaimer} onChange={setDisclaimer} testId="check-auth-disclaimer"><DisclaimerAgreement l={l} /></ConsentCheck>
                <ConsentCheck checked={adult} onChange={setAdult} testId="check-auth-adult"><AdultConfirmation l={l} /></ConsentCheck>
                {isRegister ? <ConsentCheck checked={subscription} onChange={setSubscription} testId="check-auth-subscription">{tr(l, 'For an eligible first subscription, completing Stripe checkout and adding a payment method starts a 3-day free trial. No monthly subscription fee is charged during the trial. After 3 days, it automatically renews at US$9.99/month unless you cancel before the trial ends. Previously subscribed accounts are not eligible. Creating an account alone does not start the trial or charge you.', '首次符合資格的訂閱，完成 Stripe 結帳並登記付款方式後，即開始 3 天免費試用。試用期間不收月費；3 天期滿後，訂閱會按 US$9.99/月自動續訂，除非您在試用期結束前自行取消。曾經訂閱的帳戶不適用首次試用。僅建立帳戶不會開始試用或收費。', '首次符合资格的订阅，完成 Stripe 结账并登记付款方式后，即开始 3 天免费试用。试用期间不收月费；3 天期满后，订阅会按 US$9.99/月自动续订，除非您在试用期结束前自行取消。曾经订阅的账户不适用首次试用。仅创建账户不会开始试用或收费。')}</ConsentCheck> : null}
              </div>
              <button className="button-primary" disabled={!ready} onClick={proceed} data-testid="button-auth-continue">
                {isRegister ? tr(l, 'Continue to registration', '繼續註冊', '继续注册') : tr(l, 'Continue to sign in', '繼續登入', '继续登录')} <ArrowRight size={15} />
              </button>
              <p className="membership-note">{tr(l, 'Your agreement is saved to your account right after you sign in.', '登入後，您的同意紀錄會儲存到帳戶。', '登录后，您的同意记录会保存到账户。')}</p>
            </div>
          ) : (
            <div className="clerk-frame" data-testid={`clerk-${mode}`}>
              {isRegister
                ? <SignUp routing="path" path="/register" signInUrl="/sign-in" fallbackRedirectUrl="/membership?signup=completed" forceRedirectUrl="/membership?signup=completed" />
                : <SignIn routing="path" path="/sign-in" signUpUrl="/register" fallbackRedirectUrl="/parent" />}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
