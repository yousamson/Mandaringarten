import { LegalDocument } from '@/components/legal/legal-document';
import type { Language } from '@/lib/garden-data';
import { privacyPolicy } from '@/lib/legal/privacy';
import { LEGAL_SOURCES } from '@/lib/legal-config';

export default function PrivacyPage({ language }: { language: Language }) {
  return <LegalDocument docs={privacyPolicy} language={language} source={LEGAL_SOURCES.privacy} testId="page-privacy" />;
}
