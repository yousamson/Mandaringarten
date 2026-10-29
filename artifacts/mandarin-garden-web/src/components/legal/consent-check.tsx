import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import type { Language } from '@/lib/garden-data';
import { tr } from '@/lib/playground-copy';

export function ConsentCheck({ checked, onChange, children, testId }: { checked: boolean; onChange: (value: boolean) => void; children: ReactNode; testId: string }) {
  return (
    <label className={`consent-check ${checked ? 'is-checked' : ''}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} data-testid={testId} />
      <span className="consent-box" aria-hidden="true">{checked ? <Check size={13} strokeWidth={3} /> : null}</span>
      <span className="consent-text">{children}</span>
    </label>
  );
}

/** Opens in a new tab so ticked boxes are never lost (and never need restoring). */
export function DocLink({ to, children }: { to: '/privacy' | '/disclaimer'; children: ReactNode }) {
  return <a href={to} target="_blank" rel="noopener noreferrer" className="doc-link" data-testid={`link-doc-${to.slice(1)}`}>{children}</a>;
}

export const privacyName = (l: Language) => tr(l, 'Privacy Policy', '私隱政策', '隐私政策');
export const disclaimerName = (l: Language) => tr(l, 'Disclaimer & Terms of Use', '免責聲明與使用條款', '免责声明与使用条款');

export function PrivacyAgreement({ l }: { l: Language }) {
  return <>{tr(l, 'I have read, fully understand and agree to the ', '我已閱讀、完全理解並同意', '我已阅读、完全理解并同意')}<DocLink to="/privacy">{privacyName(l)}</DocLink>{tr(l, '.', '。', '。')}</>;
}
export function DisclaimerAgreement({ l }: { l: Language }) {
  return <>{tr(l, 'I have read, fully understand and agree to the ', '我已閱讀、完全理解並同意', '我已阅读、完全理解并同意')}<DocLink to="/disclaimer">{disclaimerName(l)}</DocLink>{tr(l, '.', '。', '。')}</>;
}
export function AdultConfirmation({ l }: { l: Language }) {
  return <>{tr(l, 'I am an adult (18+ or the age of majority where I live) and the parent or legal guardian of, or responsible adult for, the children who will use this account under my supervision.', '我是成年人（年滿 18 歲或達到所在地成年年齡），並且是將在我監督下使用此帳戶之兒童的家長、法定監護人或負責成人。', '我是成年人（年满 18 岁或达到所在地成年年龄），并且是将在我监督下使用此账户之儿童的家长、法定监护人或负责成年人。')}</>;
}
