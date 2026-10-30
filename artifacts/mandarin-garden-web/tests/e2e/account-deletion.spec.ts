import { expect, test } from '@playwright/test';

const cases = [
  {
    language: 'en',
    privacy: 'Privacy Policy',
    disclaimer: 'Disclaimer & Terms of Use',
    noRefund: 'I understand paid subscription amounts are non-refundable, including unused time.',
  },
  {
    language: 'zh-Hant',
    privacy: '私隱政策',
    disclaimer: '免責聲明與使用條款',
    noRefund: '我已明白已繳付的訂閱月費不獲退還，未使用期間亦不予退款。',
  },
  {
    language: 'zh-Hans',
    privacy: '隐私政策',
    disclaimer: '免责声明与使用条款',
    noRefund: '我已明白已缴付的订阅月费不予退还，未使用期间也不予退款。',
  },
] as const;

const requiredChecks = [
  'check-delete-privacy',
  'check-delete-disclaimer',
  'check-delete-data',
  'check-delete-norefund',
  'check-delete-cancel',
] as const;

for (const copy of cases) {
  test(`requires every deletion agreement and exact confirmation in ${copy.language}`, async ({ page }) => {
    await page.goto(`/tests/e2e/index.html?language=${copy.language}`);

    await expect(page.getByTestId('page-account')).toBeVisible();
    const submit = page.getByTestId('button-delete-account');
    await expect(submit).toBeDisabled();

    const privacyLink = page.getByTestId('link-doc-privacy');
    const disclaimerLink = page.getByTestId('link-doc-disclaimer');
    await expect(privacyLink).toHaveText(copy.privacy);
    await expect(privacyLink).toHaveAttribute('href', '/privacy');
    await expect(privacyLink).toHaveAttribute('target', '_blank');
    await expect(disclaimerLink).toHaveText(copy.disclaimer);
    await expect(disclaimerLink).toHaveAttribute('href', '/disclaimer');
    await expect(disclaimerLink).toHaveAttribute('target', '_blank');
    await expect(page.getByTestId('check-delete-norefund').locator('xpath=..')).toContainText(copy.noRefund);

    for (const testId of requiredChecks) {
      await page.getByTestId(testId).check();
    }

    const confirmation = page.getByTestId('input-delete-confirm');
    await confirmation.fill('delete');
    await expect(submit).toBeDisabled();
    await confirmation.fill('DELETE ');
    await expect(submit).toBeDisabled();

    await confirmation.fill('DELETE');
    await expect(submit).toBeEnabled();

    for (const testId of requiredChecks) {
      const checkbox = page.getByTestId(testId);
      await checkbox.uncheck();
      await expect(submit).toBeDisabled();
      await submit.evaluate((button: HTMLButtonElement) => button.click());
      await expect.poll(() => page.evaluate(() => (window as any).__deletionAttempts.length)).toBe(0);
      await checkbox.check();
      await expect(submit).toBeEnabled();
    }

    await submit.click();
    await expect.poll(() => page.evaluate(() => (window as any).__deletionAttempts.length)).toBe(1);
    const request = await page.evaluate(() => (window as any).__deletionAttempts[0]);
    const currentPolicyVersion = await page.evaluate(() => (window as any).__currentLegalVersion);
    expect(request).toEqual({
      data: {
        privacyAccepted: true,
        disclaimerAccepted: true,
        dataDeletionAccepted: true,
        noRefundAccepted: true,
        subscriptionCancellationAccepted: true,
        confirmation: 'DELETE',
        policyVersion: currentPolicyVersion,
      },
    });
  });
}
