import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Show, useUser } from '@clerk/react';
import { getGetBillingStatusQueryKey, useCreateBillingCheckout, useCreateBillingPortal, useGetBillingPlan, useGetBillingStatus } from '@workspace/api-client-react';
import { ArrowRight, Check, Leaf } from 'lucide-react';
import { Link } from 'wouter';
import { ConsentCheck, DisclaimerAgreement, DocLink, PrivacyAgreement, disclaimerName } from '@/components/legal/consent-check';
import { accessQueryKey, useAccountAccess } from '@/hooks/use-account';
import { billingCopy } from '@/lib/billing-copy';
import { copy, type Language } from '@/lib/garden-data';
import { trackAnalyticsEvent } from '@/lib/analytics';
import { LEGAL_VERSION } from '@/lib/legal-config';
import { tr } from '@/lib/playground-copy';

const isForbidden = (err: unknown) => typeof err === 'object' && err !== null && (err as { status?: number }).status === 403;

/** Single source of membership checkout / portal controls, used by /parent and /membership. */
export function MembershipPanel({ l }: { l: Language }) {
  const t = copy[l];
  const client = useQueryClient();
  const { isSignedIn, user } = useUser();
  const account = useAccountAccess();
  const isAdmin = account.isAdmin;
  const uid = user?.id ?? null;
  const statusKey = [...getGetBillingStatusQueryKey(), uid];
  const status = useGetBillingStatus({ query: { enabled: Boolean(isSignedIn && account.data && !isAdmin), queryKey: statusKey, retry: false, refetchOnMount: 'always', refetchOnWindowFocus: true } });
  const plan = useGetBillingPlan({ request: { skipAuth: true, cache: 'no-store' }, query: {
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    staleTime: 300_000,
    refetchOnMount: true,
  } });
  const checkout = useCreateBillingCheckout();
  const portal = useCreateBillingPortal();
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  // Checkout acknowledgements: always start unticked, never persisted.
  const [privacyOk, setPrivacyOk] = useState(false);
  const [disclaimerOk, setDisclaimerOk] = useState(false);
  const [noRefundOk, setNoRefundOk] = useState(false);
  const [planTimedOut, setPlanTimedOut] = useState(false);
  const queryParams = new URLSearchParams(window.location.search);
  const checkoutResult = queryParams.get('checkout');
  const checkoutAnalyticsRef = queryParams.get('checkout_ref');
  const signupResult = queryParams.get('signup');
  const returnedFromPortal = queryParams.get('billing') === 'returned';
  const active = isAdmin || (status.data?.isPremium ?? false);
  const hasSubscription = ['active', 'trialing', 'past_due', 'unpaid'].includes(status.data?.subscriptionStatus ?? '');
  const isTrialing = status.data?.subscriptionStatus === 'trialing';
  const checking = Boolean(isSignedIn && (account.query.isLoading || (!account.data && !account.query.isError) || (!isAdmin && status.isLoading)));
  useEffect(() => {
    if (!plan.isLoading) {
      setPlanTimedOut(false);
      return;
    }
    const timeout = window.setTimeout(() => setPlanTimedOut(true), 5_000);
    return () => window.clearTimeout(timeout);
  }, [plan.isLoading]);
  const statusReady = Boolean(isSignedIn && status.data && !status.isError);
  const busy = checkout.isPending || portal.isPending || working || checking || plan.isLoading || Boolean(isSignedIn && (status.isError || account.query.isError));
  const allAccepted = privacyOk && disclaimerOk && noRefundOk;
  const canCheckout = !isAdmin && statusReady && Boolean(plan.data) && !plan.isError && allAccepted && !busy;
  const priceLabel = plan.data?.priceLabel ?? billingCopy[l].priceUnavailable;
  const [pollExpired, setPollExpired] = useState(false);
  const signupTracked = useRef(false);
  const subscriptionTracked = useRef(false);
  const pending = checkoutResult === 'success' && Boolean(isSignedIn) && !active;
  const checkoutNotice =
    checkoutResult === 'cancelled' ? billingCopy[l].checkoutCancelled
      : checkoutResult === 'success' ? (active ? billingCopy[l].checkoutSuccess : isSignedIn && status.isLoading ? t.loading : billingCopy[l].checkoutPending)
        : '';
  const membershipDescription = active
    ? tr(l, 'Subscribed', '已訂閱', '已订阅')
    : tr(l, 'Not subscribed', '未訂閱', '未订阅');

  const refreshAll = useRef(() => {});
  refreshAll.current = () => {
    void client.invalidateQueries({ queryKey: statusKey });
    void client.invalidateQueries({ queryKey: accessQueryKey(uid) });
  };

  // Stripe returns to this page after subscription changes. Recheck the
  // authenticated status and entitlement before showing the current state.
  useEffect(() => {
    if (!returnedFromPortal || !isSignedIn || isAdmin || !uid) return;
    void client.invalidateQueries({
      queryKey: [...getGetBillingStatusQueryKey(), uid],
      exact: true,
      refetchType: 'active',
    });
    void client.invalidateQueries({
      queryKey: accessQueryKey(uid),
      exact: true,
      refetchType: 'active',
    });
  }, [returnedFromPortal, isSignedIn, isAdmin, client, uid]);

  // Clerk redirects here only after a successful registration. Remove the flag
  // after recording it so a reload cannot count the same registration twice.
  useEffect(() => {
    if (signupResult !== 'completed' || !isSignedIn || !user?.id || signupTracked.current) return;
    signupTracked.current = true;
    trackAnalyticsEvent('signup_completed');
    const url = new URL(window.location.href);
    url.searchParams.delete('signup');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, [signupResult, isSignedIn, user?.id]);

  useEffect(() => {
    if (checkoutResult !== 'cancelled') return;
    try {
      window.sessionStorage.removeItem('mg-analytics-pending-checkout');
    } catch {
      // Analytics cleanup must not affect the cancellation result.
    }
  }, [checkoutResult]);

  // Count a subscription only after the return from checkout is confirmed as
  // active/trialing, and only for the checkout attempt started in this tab.
  useEffect(() => {
    const subscriptionStatus = status.data?.subscriptionStatus;
    if (
      checkoutResult !== 'success' ||
      !isSignedIn ||
      isAdmin ||
      !['active', 'trialing'].includes(subscriptionStatus ?? '') ||
      !checkoutAnalyticsRef ||
      subscriptionTracked.current
    ) return;

    let pendingRef: string | null = null;
    try {
      pendingRef = window.sessionStorage.getItem('mg-analytics-pending-checkout');
    } catch {
      return;
    }
    if (pendingRef !== checkoutAnalyticsRef) return;

    subscriptionTracked.current = true;
    trackAnalyticsEvent('subscription_started', {
      plan: 'premium_monthly',
      status: subscriptionStatus!,
    });
    try {
      window.sessionStorage.removeItem('mg-analytics-pending-checkout');
    } catch {
      // The membership update remains successful if browser storage is blocked.
    }
  }, [checkoutResult, isSignedIn, isAdmin, status.data?.subscriptionStatus, checkoutAnalyticsRef]);

  // After returning from Stripe: refetch now, then poll briefly while the payment is being confirmed.
  useEffect(() => {
    if (!pending) return;
    refreshAll.current();
    let ticks = 0;
    const id = window.setInterval(() => {
      ticks += 1;
      refreshAll.current();
      if (ticks >= 20) { window.clearInterval(id); setPollExpired(true); }
    }, 3000);
    return () => window.clearInterval(id);
  }, [pending]);

  // When membership becomes active, make sure the access gate learns about it.
  useEffect(() => {
    if (active && checkoutResult === 'success') {
      void client.invalidateQueries({ queryKey: accessQueryKey(uid) }).then(() => {
        if (!client.getQueryData<{ isPremium: boolean }>(accessQueryKey(uid))?.isPremium) return;
        const url = new URL(window.location.href);
        url.searchParams.delete('checkout');
        url.searchParams.delete('checkout_ref');
        window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
      });
    }
  }, [active, checkoutResult, client, uid]);

  const initiateCheckout = () => {
    setError('');
    if (!isSignedIn || isAdmin || !plan.data || !allAccepted) return;
    setWorking(true);
    let checkoutRef: string | null = null;
    try {
      checkoutRef = window.crypto.randomUUID();
      window.sessionStorage.setItem('mg-analytics-pending-checkout', checkoutRef);
    } catch {
      // Checkout remains available when browser storage is disabled.
    }
    const successUrl = new URL('/parent', window.location.origin);
    successUrl.searchParams.set('checkout', 'success');
    if (checkoutRef) successUrl.searchParams.set('checkout_ref', checkoutRef);
    checkout.mutate(
      { data: { privacyAccepted: true, disclaimerAccepted: true, noRefundAccepted: true, policyVersion: LEGAL_VERSION, successUrl: successUrl.toString(), cancelUrl: `${window.location.origin}/membership?checkout=cancelled` } },
      {
        onSuccess: (result) => { window.location.assign(result.url); },
        onError: (err) => {
          try {
            if (checkoutRef && window.sessionStorage.getItem('mg-analytics-pending-checkout') === checkoutRef) {
              window.sessionStorage.removeItem('mg-analytics-pending-checkout');
            }
          } catch {
            // Browser storage failures must not hide the checkout error.
          }
          setError(isForbidden(err) ? tr(l, 'Your account agreements need to be confirmed first. Please reload the page to review them.', '請先確認帳戶同意事項，重新載入頁面即可查看。', '请先确认账户同意事项，重新加载页面即可查看。') : t.checkoutError);
          setWorking(false);
        },
      },
    );
  };
  const openPortal = () => {
    if (isAdmin) return;
    setError('');
    setWorking(true);
    portal.mutate(
      { data: { returnUrl: `${window.location.origin}/parent` } },
      { onSuccess: (result) => { window.location.assign(result.url); }, onError: (err) => { setError(isForbidden(err) ? tr(l, 'Your account agreements need to be confirmed first.', '請先確認帳戶同意事項。', '请先确认账户同意事项。') : t.portalError); setWorking(false); } },
    );
  };
  const date = status.data?.currentPeriodEnd ? new Intl.DateTimeFormat(l, { dateStyle: 'long' }).format(new Date(status.data.currentPeriodEnd)) : '';
  return (
    <section className="panel membership-card" data-testid="panel-membership">
      <h2><Leaf size={18} /> {t.membership}</h2>
      <p className="panel-desc" data-testid="text-membership-state">{membershipDescription}</p>
      {account.query.isError && isSignedIn ? <div className="alert"><p>{tr(l, 'We could not confirm account access.', '目前無法確認帳戶權限。', '目前无法确认账户权限。')}</p><button className="button-secondary" onClick={() => void account.query.refetch()} data-testid="button-retry-access">{t.retry}</button></div> : null}
      {!isAdmin && status.isError && isSignedIn ? <div className="alert"><p>{t.failed}</p><button className="button-secondary" onClick={() => void status.refetch()} data-testid="button-retry-billing">{t.retry}</button></div> : null}
      {!isAdmin && status.data && isSignedIn && active ? <div className="setting-row"><div><div className="setting-name">{isTrialing ? tr(l, 'Free trial', '免費試用中', '免费试用中') : status.data.cancelAtPeriodEnd ? t.cancelAt : t.active}</div><div className="setting-detail">{date ? isTrialing
        ? status.data.cancelAtPeriodEnd
          ? tr(l, `Trial ends ${date}; renewal is cancelled.`, `試用期於 ${date} 結束，已取消續訂。`, `试用期于 ${date} 结束，已取消续订。`)
          : tr(l, `Trial ends ${date}; first charge is US$9.99/month unless cancelled.`, `試用期於 ${date} 結束；如未取消，將首次扣款 US$9.99/月。`, `试用期于 ${date} 结束；如未取消，将首次扣款 US$9.99/月。`)
        : `${status.data.cancelAtPeriodEnd ? tr(l, 'Access until', '可使用至', '可使用至') : t.due}: ${date}` : status.data.subscriptionStatus}</div></div><span className="status-pill">{t.premiumActive}</span></div> : null}
      {!isAdmin && !plan.isError ? <div className="plan-price">{plan.isLoading && planTimedOut ? tr(l, 'The subscription price is taking longer to load.', '月費方案載入較慢。', '月费方案加载较慢。') : plan.isLoading ? tr(l, 'Loading subscription price…', '正在載入訂閱價格…', '正在加载订阅价格…') : priceLabel} <small>{t.perMonth}</small></div> : null}
      {!isAdmin && plan.isLoading && planTimedOut ? <div className="alert" role="status"><button className="button-secondary" onClick={() => { setPlanTimedOut(false); void plan.refetch(); }} data-testid="button-retry-plan-timeout">{t.retry}</button></div> : null}
      {!isAdmin && plan.isError ? <div className="alert"><p>{billingCopy[l].priceUnavailable}</p><button className="button-secondary" onClick={() => void plan.refetch()}>{t.retry}</button></div> : null}
      {checkoutNotice ? (
        <div className="membership-note" role="status" data-testid="status-checkout">
          {checkoutNotice}
          {pending ? <span className="pending-line">{pollExpired ? tr(l, ' Still waiting for confirmation. You can check again.', ' 仍在等待確認，您可以再查一次。', ' 仍在等待确认，您可以再查一次。') : tr(l, ' Checking with the payment provider…', ' 正在向付款服務確認…', ' 正在向付款服务确认…')}</span> : null}
          {pending ? <button className="button-secondary" onClick={() => { setPollExpired(false); refreshAll.current(); }} data-testid="button-recheck-payment">{t.retry}</button> : null}
        </div>
      ) : null}
      <ul className="benefit-list">{t.benefits.map((benefit) => <li key={benefit}><Check size={15} />{benefit}</li>)}</ul>
      {error ? <div className="alert" role="alert">{error}</div> : null}
      {!isAdmin ? <Show when="signed-in">
        {hasSubscription
          ? <button className={`button-primary ${busy ? 'busy' : ''}`} onClick={openPortal} disabled={busy} data-testid="button-manage-subscription">{busy ? t.loading : t.manage} <ArrowRight size={15} /></button>
          : (
            <>
              <div className="consent-list compact" data-testid="checkout-consent">
                <ConsentCheck checked={privacyOk} onChange={setPrivacyOk} testId="check-checkout-privacy"><PrivacyAgreement l={l} /></ConsentCheck>
                <ConsentCheck checked={disclaimerOk} onChange={setDisclaimerOk} testId="check-checkout-disclaimer"><DisclaimerAgreement l={l} /></ConsentCheck>
                <ConsentCheck checked={noRefundOk} onChange={setNoRefundOk} testId="check-checkout-norefund">
                  {tr(l, 'For an eligible first subscription, Stripe checkout collects a payment method and starts a 3-day free trial. No monthly subscription fee is charged during the trial. After 3 days, it automatically renews at US$9.99/month unless you cancel before the trial ends. Previously subscribed accounts are not eligible. Membership renews monthly until cancelled; cancellation takes effect at the end of the current trial or paid period. Subscription fees are non-refundable except where mandatory law requires a refund or you were charged in error (see the ', '首次符合資格的訂閱，Stripe 結帳會登記付款方式並開始 3 天免費試用；試用期間不收月費。3 天期滿後，訂閱會按 US$9.99/月自動續訂，除非您在試用期結束前自行取消。曾經訂閱的帳戶不適用首次試用。會員訂閱會每月續訂直至取消；取消於目前試用期或已付費期間結束時生效。已繳訂閱費用恕不退還，但強制性法律規定須退款或錯誤收費者除外（詳見', '首次符合资格的订阅，Stripe 结账会登记付款方式并开始 3 天免费试用；试用期间不收月费。3 天期满后，订阅会按 US$9.99/月自动续订，除非您在试用期结束前自行取消。曾经订阅的账户不适用首次试用。会员订阅会每月续订直至取消；取消于当前试用期或已付费期间结束时生效。已缴订阅费用恕不退还，但强制性法律规定须退款或错误收费者除外（详见')}<DocLink to="/disclaimer">{disclaimerName(l)}</DocLink>{tr(l, ').', '）。', '）。')}
                </ConsentCheck>
              </div>
              <button className={`button-primary ${busy ? 'busy' : ''}`} onClick={initiateCheckout} disabled={!canCheckout} data-testid="button-upgrade">{busy ? t.loading : checkoutResult === 'cancelled' ? t.retry : t.upgrade} <ArrowRight size={15} /></button>
            </>
          )}
      </Show> : null}
      <Show when="signed-out">
        <Link href="/sign-in" className="button-primary" data-testid="button-sign-in-to-upgrade">{t.signIn} · {t.upgrade} <ArrowRight size={15} /></Link>
      </Show>
      <p className="membership-note">{t.paymentNote}</p>
    </section>
  );
}
