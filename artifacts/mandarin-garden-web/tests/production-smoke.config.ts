import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

const port = 4179;
const baseURL = `http://127.0.0.1:${port}`;
const systemChromium = '/repl/tools/bin/chromium';

export default defineConfig({
  testDir: './production-smoke',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  reporter: 'list',
  outputDir: '/tmp/mandarin-garden-production-smoke-results',
  use: {
    baseURL,
    browserName: 'chromium',
    launchOptions: {
      ...(existsSync(systemChromium) ? { executablePath: systemChromium } : {}),
      args: ['--no-sandbox'],
    },
  },
  webServer: {
    command:
      `PORT=${port} BASE_PATH=/ pnpm run build && ` +
      `PORT=${port} BASE_PATH=/ pnpm run serve`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
