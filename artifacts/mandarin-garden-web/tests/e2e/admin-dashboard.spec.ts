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

test('administrator must set a second password before dashboard access', async ({ page }) => {
  await page.goto('/tests/e2e/admin.html?admin=1&language=zh-Hant&password=setup');

  await expect(page.getByTestId('page-admin-password-setup')).toBeVisible();
  await expect(page.getByTestId('input-admin-dashboard-password')).toHaveAttribute('minlength', '8');
  await expect(page.getByTestId('button-admin-dashboard-password-submit')).toContainText('設定密碼並繼續');
  await expect(page.getByTestId('metric-member-count')).toHaveCount(0);
});

test('administrator must enter the second password after it is set', async ({ page }) => {
  await page.goto('/tests/e2e/admin.html?admin=1&language=zh-Hant&password=locked');

  await expect(page.getByTestId('page-admin-password-login')).toBeVisible();
  await expect(page.getByTestId('button-admin-dashboard-password-submit')).toContainText('解鎖後台');
  await expect(page.getByTestId('metric-member-count')).toHaveCount(0);
});

test('administrator can open the password change form after unlocking', async ({ page }) => {
  await page.goto('/tests/e2e/admin.html?admin=1&language=zh-Hant');

  await page.getByTestId('button-admin-change-password').click();
  await expect(page.getByTestId('form-admin-change-password')).toBeVisible();
  await expect(page.getByLabel('目前密碼')).toHaveAttribute('autocomplete', 'current-password');
  await expect(page.getByLabel('新密碼', { exact: true })).toHaveAttribute('minlength', '8');
});
