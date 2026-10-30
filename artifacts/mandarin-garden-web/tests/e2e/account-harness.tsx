import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AccountPage from '@/pages/account';
import { LEGAL_VERSION } from '@/lib/legal-config';
import type { Language } from '@/lib/garden-data';
import '../../src/index.css';

const language = new URLSearchParams(window.location.search).get('language') as Language | null;
const allowedLanguages: Language[] = ['en', 'zh-Hant', 'zh-Hans'];

if (!language || !allowedLanguages.includes(language)) {
  throw new Error(`Unsupported account deletion test language: ${language}`);
}

(window as Window & { __currentLegalVersion?: string }).__currentLegalVersion = LEGAL_VERSION;
(window as Window & { __deletionAttempts?: unknown[] }).__deletionAttempts = [];

const client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={client}>
    <AccountPage language={language} />
  </QueryClientProvider>,
);
