import { expect, test } from '@playwright/test';

test('the Treasure House shows HSK and PSC before offering graded practice', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/treasure-house');
  await expect(page.locator('main h1')).toHaveText('Chinese Treasure House');
  await expect(page.getByTestId('link-track-hsk')).toContainText('HSK Resource Library');
  await expect(page.getByTestId('link-track-hsk')).toContainText('nine HSK levels');
  await expect(page.getByTestId('link-track-psc')).toContainText('PSC Resource Library');
  await expect(page.locator('a[href="/treasure-house/hsk/1"]')).toHaveCount(0);

  await page.getByTestId('link-track-hsk').click();
  await expect(page).toHaveURL(/\/treasure-house\/hsk$/);
  await expect(page.getByTestId('list-graded-practice').locator('a')).toHaveCount(9);
  await expect(page.getByTestId('link-level-hsk-1')).toBeVisible();
  await expect(page.getByTestId('link-level-hsk-9')).toBeVisible();
});

test('PSC offers six levels and links its official outline', async ({ page }) => {
  await page.goto('/treasure-house/psc');
  await expect(page.getByTestId('list-graded-practice').locator('a')).toHaveCount(6);
  for (const level of ['3b', '3a', '2b', '2a', '1b', '1a']) {
    await expect(page.getByTestId(`link-level-psc-${level}`)).toBeVisible();
  }
  await expect(page.getByTestId('list-graded-practice').locator('a').first()).toHaveAttribute('href', '/treasure-house/psc/3b');
  await expect(page.getByTestId('list-graded-practice').locator('a').last()).toHaveAttribute('href', '/treasure-house/psc/1a');
  await expect(page.getByTestId('link-level-psc-3b')).toContainText('Score: 60 to under 70');
  await expect(page.getByTestId('link-level-psc-1a')).toContainText('Score: 97 to 100');
  await expect(page.getByTestId('status-track-notice')).toContainText('PSC assesses spoken Putonghua');
  await expect(page.getByTestId('link-source-psc')).toHaveAttribute('href', /moe\.gov\.cn/);
});

test('a signed-out visitor cannot open a level or its member materials', async ({ page }) => {
  await page.goto('/treasure-house/hsk/2');
  await expect(page.getByTestId('panel-level-locked')).toContainText('Sign in');
  await expect(page.getByTestId('link-locked-sign-in')).toBeVisible();
  await expect(page.getByTestId('list-word-bank')).toHaveCount(0);
});

test('the Treasure House name follows the selected interface language', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mg-language', 'es'));
  await page.goto('/treasure-house');
  await expect(page.locator('main h1')).toHaveText('Tesoro del chino');
  await expect(page.getByTestId('link-track-hsk')).toContainText('Biblioteca de recursos HSK');
  await expect(page.getByTestId('link-track-psc')).toContainText('Biblioteca de recursos PSC');
});

test('PSC score bands and descriptions are translated for Chinese readers', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mg-language', 'zh-Hant'));
  await page.goto('/treasure-house/psc');
  await expect(page.getByTestId('link-level-psc-3b')).toContainText('成績 60 分以上、未滿 70 分');
  await expect(page.getByTestId('link-level-psc-1a')).toContainText('成績 97 至 100 分');
});
