import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../public/_worker.js';

test('Worker preserves browser Origin and overwrites the public-origin carrier', async () => {
  const realFetch = globalThis.fetch;
  const origin = 'https://mandarin-garden-mobile-pwa.pages.dev';
  let forwarded;
  globalThis.fetch = async (request) => {
    forwarded = request;
    return new Response('ok');
  };
  try {
    await worker.fetch(new Request(`${origin}/api/__clerk/v1/client`, {
      headers: {
        origin,
        'x-mandarin-public-origin': 'https://attacker.example',
      },
    }));
    assert.equal(forwarded.headers.get('origin'), origin);
    assert.equal(forwarded.headers.get('x-mandarin-public-origin'), origin);
    assert.equal(new URL(forwarded.url).origin, 'https://mandarin-garden.replit.app');
  } finally {
    globalThis.fetch = realFetch;
  }
});
