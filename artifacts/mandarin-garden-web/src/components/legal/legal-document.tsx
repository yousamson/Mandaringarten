import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Language } from '@/lib/garden-data';
import type { LegalDoc } from '@/lib/legal/privacy';
import { LEGAL_SOURCES, LEGAL_VERSION, legalConfig, legalConfigComplete } from '@/lib/legal-config';
import { tr } from '@/lib/playground-copy';

const langs: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'zh-Hant', label: '繁體中文' },
  { value: 'zh-Hans', label: '简体中文' },
];

export function LegalDocument({ docs, language, source, testId }: { docs: Record<Language, LegalDoc>; language: Language; source: string; testId: string }) {
  const [shown, setShown] = useState<Language>(language);
  const doc = docs[shown];
  const l = shown;
  return (
    <main className="page-shell legal-page" data-testid={testId}>
      <header className="legal-head">
        <div className="eyebrow">{tr(l, `Version ${LEGAL_VERSION}`, `版本 ${LEGAL_VERSION}`, `版本 ${LEGAL_VERSION}`)}</div>
        <h1>{doc.title}</h1>
        <p>{doc.summary}</p>
        <div className="legal-langs" role="group" aria-label="Document language">
          {langs.map((item) => <button key={item.value} className={`filter-chip ${shown === item.value ? 'selected' : ''}`} onClick={() => setShown(item.value)} aria-pressed={shown === item.value} data-testid={`button-legal-lang-${item.value}`}>{item.label}</button>)}
        </div>
      </header>
      {!legalConfigComplete ? (
        <div className="legal-draft" role="note" data-testid="status-legal-draft">
          <AlertTriangle size={18} />
          <div>
            <strong>{tr(l, 'Draft — not for publication', '草稿——不得公開發布', '草稿——不得公开发布')}</strong>
            <p>{tr(l, 'Operator and contact details have not been provided yet, and this text has not been reviewed by a lawyer. It must not be relied on as a published policy until completed.', '營運者與聯絡資料尚未提供，本文亦未經律師審閱。在補齊之前，不得作為正式公開的政策依據。', '运营者与联系信息尚未提供，本文也未经律师审阅。在补齐之前，不得作为正式公开的政策依据。')}</p>
          </div>
        </div>
      ) : null}
      <article className="legal-body">
        {doc.sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p.map((p) => <p key={p.slice(0, 32)}>{p}</p>)}
          </section>
        ))}
        <section>
          <h2>{tr(l, 'Contact', '聯絡我們', '联系我们')}</h2>
          {legalConfigComplete ? (
            <dl className="legal-contact">
              <dt>{tr(l, 'Operator', '營運者', '运营者')}</dt><dd data-testid="text-legal-operator">{legalConfig.operatorName}</dd>
              <dt>{tr(l, 'Email', '電子郵件', '电子邮件')}</dt><dd><a className="doc-link" href={`mailto:${legalConfig.contactEmail}`}>{legalConfig.contactEmail}</a></dd>
              {legalConfig.postalAddress ? <><dt>{tr(l, 'Address', '地址', '地址')}</dt><dd>{legalConfig.postalAddress}</dd></> : null}
              {legalConfig.governingRegion ? <><dt>{tr(l, 'Governing law', '準據法', '适用法律')}</dt><dd>{legalConfig.governingRegion}</dd></> : null}
            </dl>
          ) : (
            <p className="legal-missing">{tr(l, 'Contact details pending. They will be added before publication.', '聯絡資料待補，將於正式發布前加入。', '联系信息待补，将于正式发布前加入。')}</p>
          )}
        </section>
      </article>
      <footer className="legal-source">
        {tr(l, 'Adapted from ', '改編自 ', '改编自 ')}<a className="doc-link" href={source} target="_blank" rel="noopener noreferrer">{source}</a>{tr(l, ' by Automattic, licensed under ', '（Automattic），授權條款：', '（Automattic），许可协议：')}<a className="doc-link" href={LEGAL_SOURCES.licence} target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>{tr(l, '. This adaptation is shared under the same licence. Not reviewed by a lawyer.', '。本改編版本以相同授權分享，未經律師審閱。', '。本改编版本以相同许可分享，未经律师审阅。')}
      </footer>
    </main>
  );
}
