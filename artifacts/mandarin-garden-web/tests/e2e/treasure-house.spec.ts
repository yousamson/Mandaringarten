import { expect, test } from '@playwright/test';

test('the Treasure House lists every HSK 3.0 and PSC band', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/treasure-house');

  for (const level of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) {
    await expect(page.getByTestId(`link-level-hsk-${level}`)).toBeVisible();
  }

  await page.getByTestId('tab-track-psc').click();
  for (const level of ['1a', '1b', '2a', '2b', '3a', '3b']) {
    await expect(page.getByTestId(`link-level-psc-${level}`)).toBeVisible();
  }
  await expect(page.getByTestId('status-track-notice')).toContainText('PSC assesses spoken Putonghua');
  await expect(page.getByTestId('link-source-psc')).toHaveAttribute('href', /moe\.gov\.cn/);
});

test('each exam level opens vocabulary, games, and a playable reading page', async ({ page }) => {
  test.setTimeout(120_000);
  const levelRoutes = [
    ...Array.from({ length: 9 }, (_, index) => `/treasure-house/hsk/${index + 1}`),
    ...['1a', '1b', '2a', '2b', '3a', '3b'].map((level) => `/treasure-house/psc/${level}`),
  ];

  for (const route of levelRoutes) {
    await page.goto(route);
    await expect(page.getByTestId('treasure-house')).toBeVisible();
    await expect(page.getByTestId('list-word-bank').locator('[data-testid^="word-row-"]')).toHaveCount(10);
    await expect(page.getByTestId('button-play-reading')).toBeVisible();
    await expect(page.getByTestId('button-game-mode-meaning')).toBeVisible();
    await expect(page.getByTestId('button-game-mode-listening')).toBeVisible();
    await expect(page.getByTestId('button-game-mode-pinyin')).toBeVisible();
    await expect(page.getByTestId('status-detail-notice')).toBeVisible();
  }
});

test('word search and quiz actions work on a level page', async ({ page }) => {
  await page.goto('/treasure-house/psc/2b');
  const rows = page.getByTestId('list-word-bank').locator('[data-testid^="word-row-"]');
  await expect(rows).toHaveCount(10);
  await page.getByTestId('input-word-search').fill('旅行');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('旅行');

  await page.getByTestId('input-word-search').fill('');
  await page.getByTestId('button-game-mode-pinyin').click();
  await page.getByTestId('button-answer-p2b-xingshi').click();
  await expect(page.getByTestId('status-game-feedback')).toBeVisible();
  await page.getByTestId('button-next-question').click();
  await expect(page.getByTestId('status-game-feedback')).toHaveCount(0);
});

test('reading audio starts and can be stopped', async ({ page }) => {
  await page.addInitScript(() => {
    class MockUtterance {
      text: string;
      lang = '';
      rate = 1;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) { this.text = text; }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: MockUtterance });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        cancel() {},
        speak() { (window as Window & { __speechStarted?: boolean }).__speechStarted = true; },
      },
    });
  });
  await page.goto('/treasure-house/hsk/1');
  await page.getByTestId('button-play-reading').click();
  await expect.poll(() => page.evaluate(() => (window as Window & { __speechStarted?: boolean }).__speechStarted)).toBe(true);
  await expect(page.getByTestId('status-speech')).toContainText('Speaking');
  await page.getByTestId('button-stop-reading').click();
  await expect(page.getByTestId('status-speech')).toContainText('Audio stopped');
});
