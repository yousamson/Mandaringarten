import { expect, test } from '@playwright/test';

const languages = ['zh-Hans', 'zh-Hant'] as const;
const widths = [320, 375] as const;
const routes = ['/', '/parent', '/sign-in', '/register'] as const;

for (const language of languages) {
  for (const width of widths) {
    test(`${language} layouts fit at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 640 });
      await page.addInitScript((value) => localStorage.setItem('mg-language', value), language);
      await page.goto('/');
      await expect(page.locator('.garden-app')).toHaveAttribute('lang', language);

      for (const route of routes) {
        await page.goto(route);
        await expect(page.locator('main h1').first()).toBeVisible();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          `document overflow on ${route} at ${width}px in ${language}`,
        ).toBe(true);

        const headingOverflow = await page.locator('main :is(h1, h2)').evaluateAll((headings) =>
          headings.filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.left < -1 || rect.right > window.innerWidth + 1;
          }).map((element) => element.textContent?.trim()),
        );
        expect(headingOverflow, `heading outside viewport on ${route}`).toEqual([]);

        if (route === '/' || route === '/parent') {
          await page.getByTestId('button-menu').click();
          const navLinks = page.locator('.nav-links.is-open .nav-link');
          await expect(navLinks.first()).toBeVisible();
          const navOverflow = await navLinks.evaluateAll((links) =>
            links.filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.left < -1 || rect.right > window.innerWidth + 1;
            }).map((element) => element.textContent?.trim()),
          );
          expect(navOverflow, `mobile navigation outside viewport on ${route}`).toEqual([]);
        }

        if (route === '/register') {
          const consentLabels = page.locator('.consent-check');
          await expect(consentLabels).toHaveCount(4);
          const consentOverflow = await consentLabels.evaluateAll((labels) =>
            labels.filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.left < -1 || rect.right > window.innerWidth + 1 ||
                element.scrollWidth > element.clientWidth + 1;
            }).map((element) => element.textContent?.trim()),
          );
          expect(consentOverflow, 'registration consent label overflow').toEqual([]);

          const continueButton = page.getByTestId('button-auth-continue');
          const lastConsent = consentLabels.last();
          await lastConsent.scrollIntoViewIfNeeded();
          await continueButton.scrollIntoViewIfNeeded();
          await expect(continueButton).toBeVisible();
          const buttonRect = await continueButton.boundingBox();
          expect(buttonRect).not.toBeNull();
          expect(buttonRect!.x).toBeGreaterThanOrEqual(0);
          expect(buttonRect!.x + buttonRect!.width).toBeLessThanOrEqual(width + 1);
          expect(buttonRect!.y + buttonRect!.height).toBeLessThanOrEqual(640);
        }

        const primaryOverflow = await page.locator('main .button-primary').evaluateAll((buttons) =>
          buttons.filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.left < -1 || rect.right > window.innerWidth + 1;
          }).map((element) => element.textContent?.trim()),
        );
        expect(primaryOverflow, `primary action outside viewport on ${route}`).toEqual([]);
      }
    });
  }
}
