import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const publicDir = new URL('../public/', import.meta.url);

test('robots.txt allows crawling and advertises the canonical sitemap', async () => {
  const robots = await readFile(new URL('robots.txt', publicDir), 'utf8');

  assert.match(robots, /^User-agent: \*\s+Allow: \//m);
  assert.match(
    robots,
    /^Sitemap: https:\/\/mandaringarden\.asia\/sitemap\.xml$/m,
  );
});

test('sitemap.xml lists public pages only', async () => {
  const sitemap = await readFile(new URL('sitemap.xml', publicDir), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, url]) => url,
  );

  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(
    sitemap,
    /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/,
  );
  assert.deepEqual(urls, [
    'https://mandaringarden.asia/',
    'https://mandaringarden.asia/privacy',
    'https://mandaringarden.asia/disclaimer',
    'https://mandaringarden.asia/reading/2-3',
    'https://mandaringarden.asia/reading/4-5',
    'https://mandaringarden.asia/reading/6-8',
    'https://mandaringarden.asia/reading/9-12',
  ]);
  assert.doesNotMatch(sitemap, /\/(parent|membership|account|sign-in|register)(?:\/|<)/);
});
