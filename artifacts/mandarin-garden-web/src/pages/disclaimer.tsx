import { LegalDocument } from '@/components/legal/legal-document';
import type { Language } from '@/lib/garden-data';
import { disclaimerTerms } from '@/lib/legal/disclaimer';
import { LEGAL_SOURCES } from '@/lib/legal-config';

export default function DisclaimerPage({ language }: { language: Language }) {
  return <LegalDocument docs={disclaimerTerms} language={language} source={LEGAL_SOURCES.terms} hideSourceFor={['en', 'zh-Hant', 'zh-Hans']} testId="page-disclaimer" />;
}
