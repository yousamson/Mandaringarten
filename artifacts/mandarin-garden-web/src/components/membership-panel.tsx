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
  const status = useGetBillingStatus({ query: { enabled: Boolean(isSignedIn && !isAdmin), queryKey: statusKey, retry: false, refetchOnWindowFocus: true } });
  const plan = useGetBillingPlan({ query: { retry: false, staleTime: 300_000 } });
  const checkout = useCreateBillingCheckout();
  const portal = useCreateBillingPortal();
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  // Checkout acknowledgements: always start unticked, never persisted.
  const [privacyOk, setPrivacyOk] = useState(false);
  const [disclaimerOk, setDisclaimerOk] = useState(false);
  const [noRefundOk, setNoRefundOk] = useState(false);
  const checkoutResult = new URLSearchParams(window.location.search).get('checkout');
  const active = isAdmin || (status.data?.isPremium ?? false);
  const hasSubscription = ['active', 'trialing', 'past_due', 'unpaid'].includes(status.data?.subscriptionStatus ?? '');
  const checking = Boolean(isSignedIn && (account.query.isLoading || (!account.data && !account.query.isError) || (!isAdmin && status.isLoading)));
  const statusReady = Boolean(isSignedIn && status.data && !status.isError);
  const busy = checkout.isPending || portal.isPending || working || checking || plan.isLoading || Boolean(isSignedIn && (status.isError || account.query.isError));
  const allAccepted = privacyOk && disclaimerOk && noRefundOk;
  const canCheckout = !isAdmin && statusReady && Boolean(plan.data) && !plan.isError && allAccepted && !busy;
  const priceLabel = plan.data?.priceLabel ?? billingCopy[l].priceUnavailable;
  const [pollExpired, setPollExpired] = useState(false);
  const pending = checkoutResult === 'success' && Boolean(isSignedIn) && !active;
  const checkoutNotice =
    checkoutResult === 'cancelled' ? billingCopy[l].checkoutCancelled
      : checkoutResult === 'success' ? (active ? billingCopy[l].checkoutSuccess : isSignedIn && status.isLoading ? t.loading : billingCopy[l].checkoutPending)
        : '';

  const refreshAll = useRef(() => {});
  refreshAll.current = () => {
    void client.invalidateQueries({ queryKey: statusKey });
    void client.invalidateQueries({ queryKey: accessQueryKey(uid) });
  };

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
        window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
      });
    }
  }, [active, checkoutResult, client, uid]);

  const initiateCheckout = () => {
    setError('');
    if (!isSignedIn || isAdmin || !plan.data || !allAccepted) return;
    setWorking(true);
    checkout.mutate(
      { data: { privacyAccepted: true, disclaimerAccepted: true, noRefundAccepted: true, policyVersion: LEGAL_VERSION, successUrl: `${window.location.origin}/parent?checkout=success`, cancelUrl: `${window.location.origin}/membership?checkout=cancelled` } },
      {
        onSuccess: (result) => { window.location.assign(result.url); },
        onError: (err) => {
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
      <p className="panel-desc" data-testid="text-membership-state">{checking ? t.loading : account.query.isError && isSignedIn ? tr(l, 'We could not confirm account access. Please try again.', '目前無法確認帳戶權限，請重試。', '目前无法确认账户权限，请重试。') : !isAdmin && status.isError && isSignedIn ? t.failed : isAdmin ? tr(l, 'Administrator membership is complimentary and stays active without payment or renewal.', '管理員會員免費並持續有效，無需付款或續訂。', '管理员会员免费并持续有效，无需付款或续订。') : active ? t.premiumActive : tr(l, 'No active membership', '尚無有效會員', '尚无有效会员')}</p>
      {account.query.isError && isSignedIn ? <div className="alert"><p>{tr(l, 'We could not confirm account access.', '目前無法確認帳戶權限。', '目前无法确认账户权限。')}</p><button className="button-secondary" onClick={() => void account.query.refetch()} data-testid="button-retry-access">{t.retry}</button></div> : null}
      {!isAdmin && status.isError && isSignedIn ? <div className="alert"><p>{t.failed}</p><button className="button-secondary" onClick={() => void status.refetch()} data-testid="button-retry-billing">{t.retry}</button></div> : null}
      {!isAdmin && status.data && isSignedIn && active ? <div className="setting-row"><div><div className="setting-name">{status.data.cancelAtPeriodEnd ? t.cancelAt : t.active}</div><div className="setting-detail">{date ? `${status.data.cancelAtPeriodEnd ? tr(l, 'Access until', '可使用至', '可使用至') : t.due}: ${date}` : status.data.subscriptionStatus}</div></div><span className="status-pill">{t.premiumActive}</span></div> : null}
      {!isAdmin && !plan.isError ? <div className="plan-price">{plan.isLoading ? t.loading : priceLabel} <small>{t.perMonth}</small></div> : null}
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
                  {tr(l, 'I understand membership renews monthly until cancelled, cancellation takes effect at the end of the paid period, and payments are non-refundable except where mandatory law requires a refund or I was charged in error (see the ', '我了解會員每月自動續訂直至取消，取消於已付費期間結束時生效，且費用恕不退還；但強制性法律規定須退款或錯誤收費者除外（詳見', '我了解会员每月自动续订直至取消，取消于已付费期间结束时生效，且费用恕不退还；但强制性法律规定须退款或错误收费者除外（详见')}<DocLink to="/disclaimer">{disclaimerName(l)}</DocLink>{tr(l, ').', '）。', '）。')}
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
