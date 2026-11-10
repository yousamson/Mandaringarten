import { expect, test } from '@playwright/test';

const routes = [
  { path: '/', content: '.garden-app main' },
  { path: '/reading/2-3', content: '[data-testid="page-free-reading"] h1' },
  { path: '/privacy', content: '[data-testid="page-privacy"] h1' },
  { path: '/disclaimer', content: '[data-testid="page-disclaimer"] h1' },
] as const;

test('production bundle renders public routes without runtime errors', async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    // A missing optional API/resource can emit a browser network error without
    // being a JavaScript exception. Runtime errors logged by React are retained.
    if (
      message.type() === 'error' &&
      !message.text().startsWith('Failed to load resource:')
    ) {
      browserErrors.push(message.text());
    }
  });

  for (const route of routes) {
    const response = await page.goto(route.path);
    expect(response, `${route.path} should return a response`).not.toBeNull();
    expect(response!.status(), `${route.path} should load successfully`).toBeLessThan(400);
    await expect(page.locator(route.content), `${route.path} should render its page`).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Something went wrong' }),
      `${route.path} should not show the app error boundary`,
    ).toHaveCount(0);
  }

  expect(browserErrors, 'production routes should not log browser errors').toEqual([]);
});
