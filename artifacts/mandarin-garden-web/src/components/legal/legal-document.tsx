import { useState } from 'react';
import type { Language } from '@/lib/garden-data';
import type { LegalDoc } from '@/lib/legal/privacy';
import { LEGAL_SOURCES, LEGAL_VERSION, legalConfig, legalConfigComplete } from '@/lib/legal-config';
import { tr } from '@/lib/playground-copy';

const langs: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'zh-Hant', label: '繁體中文' },
  { value: 'zh-Hans', label: '简体中文' },
];

export function LegalDocument({ docs, language, source, testId, hideSourceFor = [] }: { docs: Record<Language, LegalDoc>; language: Language; source: string; testId: string; hideSourceFor?: Language[] }) {
  const [shown, setShown] = useState<Language>(language);
  const doc = docs[shown];
  const l = shown;
  return (
    <main className="page-shell legal-page" lang={l} data-testid={testId}>
      <header className="legal-head">
        <div className="eyebrow">{tr(l, `Version ${LEGAL_VERSION}`, `版本 ${LEGAL_VERSION}`, `版本 ${LEGAL_VERSION}`)}</div>
        <h1>{doc.title}</h1>
        <p>{doc.summary}</p>
        <div className="legal-langs" role="group" aria-label="Document language">
          {langs.map((item) => <button key={item.value} className={`filter-chip ${shown === item.value ? 'selected' : ''}`} onClick={() => setShown(item.value)} aria-pressed={shown === item.value} data-testid={`button-legal-lang-${item.value}`}>{item.label}</button>)}
        </div>
      </header>
      <article className="legal-body">
        {doc.sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p.map((p) => <p key={p.slice(0, 32)}>{p}</p>)}
          </section>
        ))}
        <section>
          <h2>{tr(l, 'Contact method', '聯絡方式', '联系方式')}</h2>
          {legalConfigComplete ? (
            <dl className="legal-contact">
              <dt>{tr(l, 'Operator', '營運者', '运营者')}</dt><dd data-testid="text-legal-operator">{legalConfig.operatorName}</dd>
              <dt>{tr(l, 'Email', '電子郵件', '电子邮件')}</dt><dd><a className="doc-link" href={`mailto:${legalConfig.contactEmail}`}>{legalConfig.contactEmail}</a></dd>
              {legalConfig.postalAddress ? <><dt>{tr(l, 'Address', '地址', '地址')}</dt><dd>{legalConfig.postalAddress}</dd></> : null}
              {legalConfig.governingRegion ? <><dt>{tr(l, 'Governing law', '準據法', '适用法律')}</dt><dd>{legalConfig.governingRegion}</dd></> : null}
            </dl>
          ) : (
            <p className="legal-missing">{tr(l, 'For questions, contact the team using the platform Messages feature.', '如有疑問，請透過平台「訊息」功能與團隊聯繫。', '如有疑问，请通过平台“消息”功能联系团队。')}</p>
          )}
        </section>
      </article>
      {!hideSourceFor.includes(l) && <footer className="legal-source">
        {tr(l, 'Adapted from ', '改編自 ', '改编自 ')}<a className="doc-link" href={source} target="_blank" rel="noopener noreferrer">{source}</a>{tr(l, ' by Automattic, licensed under ', '（Automattic），授權條款：', '（Automattic），许可协议：')}<a className="doc-link" href={LEGAL_SOURCES.licence} target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>{tr(l, '. This adaptation is shared under the same licence.', '。本改編版本以相同授權分享。', '。本改编版本以相同许可分享。')}
      </footer>}
    </main>
  );
}
