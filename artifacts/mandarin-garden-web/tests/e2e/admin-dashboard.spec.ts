import { expect, test } from '@playwright/test';

test('administrator can see registrations and aggregate page views', async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto('/tests/e2e/admin.html?admin=1&language=zh-Hant');

  await expect(page.getByTestId('page-admin-dashboard')).toBeVisible();
  await expect(page.getByTestId('metric-member-count')).toContainText('註冊帳戶');
  await expect(page.getByTestId('metric-page-views')).toContainText('12');
  await expect(page.getByTestId('row-admin-member-parent-user-1')).toContainText('parent@example.test');
  await expect(page.getByTestId('section-daily-page-views')).toContainText('每日頁面瀏覽');
  await expect(page.locator('main')).not.toContainText('yousamson@gmail.com');
});

test('non-admin account is denied dashboard data', async ({ page }) => {
  await page.goto('/tests/e2e/admin.html?admin=0&language=zh-Hant');

  await expect(page.getByTestId('panel-admin-denied')).toBeVisible();
  await expect(page.getByTestId('metric-member-count')).toHaveCount(0);
});
