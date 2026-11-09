import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const root = path.resolve(import.meta.dirname, '../..');
const testMocks = path.resolve(import.meta.dirname, 'mocks');

export default defineConfig({
  root,
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@/hooks/use-account', replacement: path.join(testMocks, 'use-account.ts') },
      { find: '@/components/access-gate', replacement: path.join(testMocks, 'access-gate.tsx') },
      { find: '@clerk/react/internal', replacement: path.join(testMocks, 'clerk-internal.ts') },
      { find: '@clerk/react', replacement: path.join(testMocks, 'clerk.tsx') },
      { find: '@workspace/api-client-react', replacement: path.join(testMocks, 'api-client-react.ts') },
      { find: '@', replacement: path.resolve(root, 'src') },
    ],
  },
  optimizeDeps: { entries: ['index.html', 'tests/e2e/index.html'] },
  server: { host: '127.0.0.1', port: 4178, strictPort: true },
});
