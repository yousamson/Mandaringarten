import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useClerk } from '@clerk/react';
import { useDeleteAccount } from '@workspace/api-client-react';
import { AlertTriangle, MessageCircle, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import { AccessChecking, AccountSignOut } from '@/components/access-gate';
import { ConsentCheck, DisclaimerAgreement, PrivacyAgreement } from '@/components/legal/consent-check';
import { clearUserLocalData, useAccountAccess } from '@/hooks/use-account';
import type { Language } from '@/lib/garden-data';
import { LEGAL_VERSION } from '@/lib/legal-config';
import { tr } from '@/lib/playground-copy';

export default function AccountPage({ language: l }: { language: Language }) {
  const a = useAccountAccess();
  const client = useQueryClient();
  const { signOut } = useClerk();
  const del = useDeleteAccount();
  const [privacyOk, setPrivacyOk] = useState(false);
  const [disclaimerOk, setDisclaimerOk] = useState(false);
  const [dataOk, setDataOk] = useState(false);
  const [refundOk, setRefundOk] = useState(false);
  const [cancelOk, setCancelOk] = useState(false);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState('');
  const [finishing, setFinishing] = useState(false);

  if (!a.isLoaded) return <AccessChecking l={l} />;
  if (!a.isSignedIn) {
    return (
      <main className="page-shell"><section className="consent-shell">
        <h1>{tr(l, 'Sign in to manage your account.', '請登入以管理帳戶。', '请登录以管理账户。')}</h1>
        <div className="button-row"><Link href="/sign-in" className="button-primary" data-testid="link-account-sign-in">{tr(l, 'Sign in', '登入', '登录')}</Link></div>
      </section></main>
    );
  }
  const deleting = a.data?.access === 'deleting';
  const ready = privacyOk && disclaimerOk && dataOk && refundOk && cancelOk && typed === 'DELETE' && !del.isPending && !finishing;
  const submit = () => {
    if (!ready) return;
    setError('');
    del.mutate({ data: { privacyAccepted: true, disclaimerAccepted: true, dataDeletionAccepted: true, noRefundAccepted: true, subscriptionCancellationAccepted: true, confirmation: 'DELETE', policyVersion: LEGAL_VERSION } }, {
      onSuccess: (result) => {
        if (result?.deleted !== true) { setError(tr(l, 'Deletion did not complete. Nothing is final yet; please try again.', '刪除未完成，請再試一次。', '删除未完成，请再试一次。')); return; }
        setFinishing(true);
        const uid = a.uid;
        client.clear();
        clearUserLocalData(uid);
        void signOut({ redirectUrl: '/' }).catch(() => window.location.assign('/'));
      },
      onError: () => setError(tr(l, 'Deletion could not be completed. Your request can be retried safely; please try again.', '無法完成刪除。可以安全地重試，請再試一次。', '无法完成删除。可以安全地重试，请再试一次。')),
    });
  };

  return (
    <main className="page-shell" data-testid="page-account">
      <section className="page-title">
        <div className="eyebrow">{tr(l, 'Your parent account', '家長帳戶', '家长账户')}</div>
        <h1>{tr(l, 'Account and deletion', '帳戶與刪除', '账户与删除')}</h1>
        <p>{tr(l, 'Available to every signed-in account, with or without a membership.', '所有已登入帳戶皆可使用，不論是否為會員。', '所有已登录账户均可使用，无论是否为会员。')}</p>
      </section>
      <div className="parent-grid">
        <section className="panel danger-panel">
          {deleting ? <div className="alert" role="status" data-testid="status-deleting">{tr(l, 'A deletion for this account started but has not finished. Confirm below to retry it.', '此帳戶的刪除程序已開始但尚未完成，請在下方確認以重試。', '此账户的删除程序已开始但尚未完成，请在下方确认以重试。')}</div> : null}
          <h2><Trash2 size={18} /> {tr(l, 'Permanently delete this account', '永久刪除此帳戶', '永久删除此账户')}</h2>
          <p className="panel-desc">{tr(l, 'This signs you out everywhere and cannot be undone.', '此操作會讓您在所有裝置登出，且無法復原。', '此操作会让您在所有设备退出登录，且无法恢复。')}</p>
          <ul className="fine-list">
            <li>{tr(l, 'Deleted: your sign-in identity, saved learning progress and XP, stage choice, policy agreements and all support messages.', '將刪除：登入身分、已儲存的學習進度與經驗值、階段選擇、政策同意紀錄及所有客服訊息。', '将删除：登录身份、已保存的学习进度与经验值、阶段选择、政策同意记录及所有客服消息。')}</li>
            <li>{tr(l, 'Any ongoing subscription is cancelled immediately and access ends now.', '進行中的訂閱會立即取消，使用權即刻結束。', '进行中的订阅会立即取消，使用权即刻结束。')}</li>
            <li>{tr(l, 'Not erased: payment and transaction records our payment processor, Stripe, must keep by law, and a minimal one-way (hashed) security record used to stop a deleted account being misused.', '不會刪除：付款處理商 Stripe 依法須保留的付款與交易紀錄，以及用於防止已刪除帳戶遭濫用的最少量單向雜湊安全紀錄。', '不会删除：付款处理商 Stripe 依法须保留的付款与交易记录，以及用于防止已删除账户遭滥用的最少量单向哈希安全记录。')}</li>
          </ul>
          <div className="consent-list">
            <ConsentCheck checked={privacyOk} onChange={setPrivacyOk} testId="check-delete-privacy"><PrivacyAgreement l={l} /></ConsentCheck>
            <ConsentCheck checked={disclaimerOk} onChange={setDisclaimerOk} testId="check-delete-disclaimer"><DisclaimerAgreement l={l} /></ConsentCheck>
            <ConsentCheck checked={dataOk} onChange={setDataOk} testId="check-delete-data">{tr(l, 'I understand my account, learning progress and messages will be permanently and irreversibly deleted.', '我了解我的帳戶、學習進度與訊息將被永久且不可逆地刪除。', '我了解我的账户、学习进度与消息将被永久且不可逆地删除。')}</ConsentCheck>
            <ConsentCheck checked={refundOk} onChange={setRefundOk} testId="check-delete-norefund">{tr(l, 'I understand paid subscription amounts are non-refundable, including unused time, except where applicable law requires a refund or the charge was made in error.', '我已明白已繳付的訂閱月費不獲退還，未使用期間亦不予退款；但適用法律要求退款或屬錯誤收費者除外。', '我已明白已缴付的订阅月费不予退还，未使用期间也不予退款；但适用法律要求退款或属于错误收费的情况除外。')}</ConsentCheck>
            <ConsentCheck checked={cancelOk} onChange={setCancelOk} testId="check-delete-cancel">{tr(l, 'I understand any ongoing subscription is cancelled immediately and my access ends now.', '我了解進行中的訂閱會立即取消，使用權即刻結束。', '我了解进行中的订阅会立即取消，使用权即刻结束。')}</ConsentCheck>
          </div>
          <label className="field-label" htmlFor="delete-confirm">{tr(l, 'Type DELETE to confirm', '請輸入 DELETE 以確認', '请输入 DELETE 以确认')}</label>
          <input id="delete-confirm" className="text-field mono" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} data-testid="input-delete-confirm" />
          {error ? <div className="alert" role="alert"><AlertTriangle size={14} /> {error}</div> : null}
          <button className="button-danger" disabled={!ready} onClick={submit} data-testid="button-delete-account">
            {del.isPending || finishing ? tr(l, 'Deleting…', '刪除中…', '删除中…') : deleting || error ? tr(l, 'Retry permanent deletion', '重試永久刪除', '重试永久删除') : tr(l, 'Permanently delete my account', '永久刪除我的帳戶', '永久删除我的账户')}
          </button>
        </section>
        <aside>
          <section className="panel">
            <h2>{tr(l, 'Need help instead?', '需要協助嗎？', '需要协助吗？')}</h2>
            <p className="panel-desc">{tr(l, 'If you only want to stop renewal, cancel in the billing portal; you keep access until the paid period ends.', '若只想停止續訂，可在帳單入口取消，已付費期間結束前仍可使用。', '若只想停止续订，可在账单入口取消，已付费期间结束前仍可使用。')}</p>
            <div className="button-row">
              <Link href="/messages" className="button-secondary" data-testid="link-account-messages"><MessageCircle size={14} /> {tr(l, 'Message the team', '聯絡團隊', '联系团队')}</Link>
              <Link href="/membership" className="button-secondary" data-testid="link-account-membership">{tr(l, 'Membership', '會員', '会员')}</Link>
              <AccountSignOut l={l} />
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
