import { existsSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from '@playwright/test';

const systemChromium = '/repl/tools/bin/chromium';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  outputDir: '/tmp/mandarin-garden-account-deletion-results',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4178',
    browserName: 'chromium',
    launchOptions: {
      ...(existsSync(systemChromium) ? { executablePath: systemChromium } : {}),
      args: ['--no-sandbox'],
    },
  },
  webServer: {
    command: 'pnpm exec vite --config tests/e2e/vite.config.ts',
    url: 'http://127.0.0.1:4178/tests/e2e/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
