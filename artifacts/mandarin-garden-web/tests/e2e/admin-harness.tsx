import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminPage from '@/pages/admin';
import type { Language } from '@/lib/garden-data';
import '../../src/index.css';

const params = new URLSearchParams(window.location.search);
const language = (params.get('language') ?? 'en') as Language;
const client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={client}>
    <div className="garden-app theme-meadow" lang={language}>
      <AdminPage language={language} />
    </div>
  </QueryClientProvider>,
);
