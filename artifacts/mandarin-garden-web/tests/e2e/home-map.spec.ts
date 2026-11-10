import { expect, test } from '@playwright/test';

test('the learning map opens each focused learning area', async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto('/');
  await expect(page.getByTestId('garden-map')).toBeVisible();

  const destinations = [
    { link: 'link-map-challenge', path: '/challenge', heading: 'A little challenge, every day' },
    { link: 'link-map-learn', path: '/learn', heading: 'Choose a little path' },
    { link: 'link-map-playground', path: '/playground', heading: 'Four stages. Any order. Your call.' },
    { link: 'link-map-stories', path: '/stories', heading: 'Stories to share' },
    { link: 'link-map-translation', path: '/translation', heading: 'Look up a word' },
    { link: 'link-map-garden', path: '/garden', heading: 'Growing, day by day' },
  ];

  for (const destination of destinations) {
    await page.goto('/');
    await page.getByTestId(destination.link).click();
    await expect(page).toHaveURL(new RegExp(`${destination.path.replaceAll('/', '\\/')}$`));
    await expect(page.locator('main h1').first()).toContainText(destination.heading);
  }
});
