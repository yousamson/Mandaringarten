import { expect, test } from '@playwright/test';

const languages = ['zh-Hans', 'zh-Hant'] as const;
const widths = [320, 375] as const;
const routes = [
  '/',
  '/home',
  '/treasure-house',
  '/learn',
  '/challenge',
  '/playground',
  '/stories',
  '/translation',
  '/garden',
  '/parent',
  '/sign-in',
  '/register',
  '/privacy',
  '/disclaimer',
] as const;

for (const language of languages) {
  for (const width of widths) {
    test(`${language} layouts fit at ${width}px`, async ({ page }) => {
      test.setTimeout(90_000);
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

        if (route === '/privacy' || route === '/disclaimer') {
          const legalPage = page.locator('main.legal-page');
          await expect(legalPage).toHaveAttribute('lang', language);
          await page.evaluate(() => {
            const fallback = document.querySelector('.legal-body section:last-child .legal-missing');
            if (!fallback) return;

            const details = document.createElement('dl');
            details.className = 'legal-contact';
            const entries = [
              ['Operator', 'Mandarin Garden Family Learning Support'],
              ['Email', 'privacy-support-for-families@mandaringarden.example'],
              ['Address', '123456789 Long Road, Family Learning District, Example Region'],
            ];
            for (const [label, value] of entries) {
              const term = document.createElement('dt');
              term.textContent = label;
              const description = document.createElement('dd');
              if (label === 'Email') {
                const link = document.createElement('a');
                link.className = 'doc-link';
                link.href = `mailto:${value}`;
                link.textContent = value;
                description.append(link);
              } else {
                description.textContent = value;
              }
              details.append(term, description);
            }
            fallback.replaceWith(details);
          });
          const legalContentOverflow = await legalPage.locator(
            '.legal-head :is(h1, p), .legal-body :is(h2, p, a, dt, dd), .legal-missing, .legal-source',
          ).evaluateAll((elements) =>
            elements.filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.left < -1 || rect.right > window.innerWidth + 1 ||
                element.scrollWidth > element.clientWidth + 1 ||
                element.scrollHeight > element.clientHeight + 1;
            }).map((element) => element.textContent?.trim()),
          );
          expect(legalContentOverflow, `${route} content overflow at ${width}px in ${language}`).toEqual([]);
        }

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
