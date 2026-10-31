import { useEffect, useState, type ReactNode } from 'react';
import { useClerk } from '@clerk/react';
import { ArrowRight, LogOut, MessageCircle, RotateCcw, ShieldAlert, Sprout, UserX } from 'lucide-react';
import { Link } from 'wouter';
import { MembershipPanel } from '@/components/membership-panel';
import { useAccountAccess } from '@/hooks/use-account';
import { clearAuthConsent } from '@/hooks/use-consent';
import type { Language } from '@/lib/garden-data';
import { tr } from '@/lib/playground-copy';

export function AccountSignOut({ l, className = 'button-secondary' }: { l: Language; className?: string }) {
  const { signOut } = useClerk();
  return <button type="button" className={className} onClick={() => { clearAuthConsent(); void signOut({ redirectUrl: '/' }); }} data-testid="button-gate-sign-out"><LogOut size={14} /> {tr(l, 'Sign out', '登出', '退出登录')}</button>;
}

export function AccessChecking({ l }: { l: Language }) {
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => setTimedOut(true), 15_000);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <main className="page-shell"><div className="consent-shell" aria-busy="true">
      {timedOut ? (
        <>
          <div className="alert" role="alert">{tr(l, 'We could not confirm account access in time. Please retry or return to the garden.', '確認帳戶權限逾時，請重試或返回樂園。', '确认账户权限超时，请重试或返回乐园。')}</div>
          <div className="button-row">
            <button className="button-primary" onClick={() => window.location.reload()} data-testid="button-reload-access">{tr(l, 'Try again', '重新載入', '重新加载')}</button>
            <Link href="/" className="button-secondary" data-testid="link-access-home">{tr(l, 'Return to the garden', '返回樂園', '返回乐园')}</Link>
          </div>
        </>
      ) : (
        <>
          <div className="skeleton-line w40" /><div className="skeleton-line w80" /><div className="skeleton-block" />
          <p className="panel-desc" role="status">{tr(l, 'Checking your account access…', '正在確認帳戶權限…', '正在确认账户权限…')}</p>
        </>
      )}
    </div></main>
  );
}

export function AccessError({ l, onRetry }: { l: Language; onRetry: () => void }) {
  return (
    <main className="page-shell"><div className="consent-shell">
      <div className="alert" role="alert">{tr(l, 'We could not confirm your account access. Member features stay closed until we can.', '無法確認帳戶權限，確認前會員功能暫不開放。', '无法确认账户权限，确认前会员功能暂不开放。')}</div>
      <div className="button-row">
        <button className="button-primary" onClick={onRetry} data-testid="button-retry-access"><RotateCcw size={14} /> {tr(l, 'Try again', '再試一次', '再试一次')}</button>
        <SupportLinks l={l} />
      </div>
    </div></main>
  );
}

function SupportLinks({ l }: { l: Language }) {
  return (
    <>
      <Link href="/messages" className="button-secondary" data-testid="link-gate-messages"><MessageCircle size={14} /> {tr(l, 'Message the team', '聯絡團隊', '联系团队')}</Link>
      <Link href="/account" className="button-secondary" data-testid="link-gate-account"><UserX size={14} /> {tr(l, 'Delete account', '刪除帳戶', '删除账户')}</Link>
      <AccountSignOut l={l} />
    </>
  );
}

export function DeletionPending({ l }: { l: Language }) {
  return (
    <main className="page-shell"><section className="consent-shell" data-testid="panel-deletion-pending">
      <span className="consent-seal warn"><ShieldAlert size={24} /></span>
      <div className="eyebrow">{tr(l, 'Account deletion', '刪除帳戶', '删除账户')}</div>
      <h1>{tr(l, 'Your account deletion has not finished.', '帳戶刪除尚未完成。', '账户删除尚未完成。')}</h1>
      <p className="panel-desc">{tr(l, 'A deletion request was started for this account, so the garden is closed. Please retry the deletion to complete it.', '此帳戶已開始刪除程序，因此樂園已關閉。請重試以完成刪除。', '此账户已开始删除程序，因此乐园已关闭。请重试以完成删除。')}</p>
      <div className="button-row">
        <Link href="/account" className="button-primary" data-testid="link-retry-deletion">{tr(l, 'Retry deletion', '重試刪除', '重试删除')} <ArrowRight size={14} /></Link>
        <AccountSignOut l={l} />
      </div>
    </section></main>
  );
}

export function SubscriptionRequired({ l }: { l: Language }) {
  return (
    <main className="page-shell" data-testid="page-subscription-required">
      <section className="page-title">
        <div className="eyebrow"><Sprout size={14} /> {tr(l, 'Membership required', '需要會員資格', '需要会员资格')}</div>
        <h1>{tr(l, 'Your account is ready. The garden opens with membership.', '帳戶已建立，加入會員即可進入樂園。', '账户已创建，加入会员即可进入乐园。')}</h1>
        <p>{tr(l, 'Signed-in parent accounts need an active monthly membership to use the Learning playground, lessons and the parent dashboard. Creating an account does not start a membership; it begins only after a successful payment. If your membership has ended, renewing restores access to your saved progress.', '已登入的家長帳戶需有有效的月度會員，才能使用學習樂園、課程與家長專區。建立帳戶本身不會開通會員，須付款成功後才會生效。若會員已到期，續訂即可恢復已儲存的進度。', '已登录的家长账户需有有效的月度会员，才能使用学习乐园、课程与家长专区。创建账户本身不会开通会员，须付款成功后才会生效。若会员已到期，续订即可恢复已保存的进度。')}</p>
      </section>
      <div className="parent-grid">
        <div>
          <section className="panel">
            <h2>{tr(l, 'Still available to you', '您仍可使用', '您仍可使用')}</h2>
            <p className="panel-desc">{tr(l, 'Without membership you can still contact the team, delete your account, read our policies, or sign out and browse the free garden.', '未加入會員時，您仍可聯絡團隊、刪除帳戶、閱讀政策，或登出後瀏覽免費內容。', '未加入会员时，您仍可联系团队、删除账户、阅读政策，或退出登录后浏览免费内容。')}</p>
            <div className="button-row"><SupportLinks l={l} /></div>
            <div className="quiet-links">
              <Link href="/privacy" className="doc-link">{tr(l, 'Privacy Policy', '隱私政策', '隐私政策')}</Link>
              <Link href="/disclaimer" className="doc-link">{tr(l, 'Disclaimer & Terms', '免責聲明與條款', '免责声明与条款')}</Link>
            </div>
          </section>
        </div>
        <aside><MembershipPanel l={l} /></aside>
      </div>
    </main>
  );
}

/** Member-only routes. Signed-out visitors see free content; signed-in access is decided by the server and fails closed. */
export function MemberGate({ l, children }: { l: Language; children: ReactNode }) {
  const a = useAccountAccess();
  if (!a.isLoaded) return <AccessChecking l={l} />;
  if (!a.isSignedIn) return <>{children}</>;
  if (a.query.isError) return <AccessError l={l} onRetry={() => void a.query.refetch()} />;
  if (!a.data) return <AccessChecking l={l} />;
  if (a.data.access === 'deleting') return <DeletionPending l={l} />;
  if (a.data.access === 'active' || a.data.isAdmin) return <>{children}</>;
  return <SubscriptionRequired l={l} />;
}

export function MembershipPage({ l }: { l: Language }) {
  const a = useAccountAccess();
  if (!a.isLoaded) return <AccessChecking l={l} />;
  if (!a.isSignedIn) {
    return (
      <main className="page-shell"><section className="consent-shell">
        <div className="eyebrow">{tr(l, 'Family membership', '家庭會員', '家庭会员')}</div>
        <h1>{tr(l, 'Sign in to start or renew a membership.', '請先登入以開始或續訂會員。', '请先登录以开始或续订会员。')}</h1>
        <p className="panel-desc">{tr(l, 'The free lessons stay open without an account.', '免費課程無需帳戶即可使用。', '免费课程无需账户即可使用。')}</p>
        <div className="button-row"><Link href="/sign-in" className="button-primary" data-testid="link-membership-sign-in">{tr(l, 'Sign in', '登入', '登录')}</Link><Link href="/register" className="button-secondary" data-testid="link-membership-register">{tr(l, 'Create an account', '建立帳戶', '创建账户')}</Link></div>
      </section></main>
    );
  }
  if (a.query.isError) return <AccessError l={l} onRetry={() => void a.query.refetch()} />;
  if (!a.data) return <AccessChecking l={l} />;
  if (a.data.access === 'deleting') return <DeletionPending l={l} />;
  if (a.data.access === 'active') {
    return (
      <main className="page-shell">
        <section className="page-title">
          <div className="eyebrow">{tr(l, 'Family membership', '家庭會員', '家庭会员')}</div>
          <h1>{tr(l, 'Your membership is active.', '您的會員有效。', '您的会员有效。')}</h1>
          <Link href="/parent" className="button-primary" data-testid="link-membership-parent">{tr(l, 'Go to For parents', '前往家長專區', '前往家长专区')} <ArrowRight size={14} /></Link>
        </section>
        <div className="narrow-col"><MembershipPanel l={l} /></div>
      </main>
    );
  }
  return <SubscriptionRequired l={l} />;
}
