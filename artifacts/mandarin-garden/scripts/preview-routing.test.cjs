const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createPreviewRouting } = require('./preview-routing.cjs');

function request(url, domain = 'preview.example.test') {
  const result = {};
  const middleware = createPreviewRouting(() => { result.passedThrough = true; }, domain);
  middleware({ url }, {
    writeHead(status, headers) { Object.assign(result, { status, headers }); },
    end(body) { result.body = body; },
  });
  return result;
}

test('shared mobile entry redirects to the dedicated Expo root', () => {
  for (const path of ['/mobile', '/mobile/']) {
    const result = request(path);
    assert.equal(result.status, 302);
    assert.equal(result.headers.Location, 'https://preview.example.test/');
    assert.equal(result.headers['Cache-Control'], 'no-store');
  }
});

test('deep links and query parameters survive the redirect', () => {
  assert.equal(request('/mobile/sign-in?redirect=lessons').headers.Location,
    'https://preview.example.test/sign-in?redirect=lessons');
});

test('native entry, manifest, bundles, health and unrelated routes are untouched', () => {
  for (const path of ['/', '/manifest?platform=ios', '/status', '/assets/icon.png',
    '/entry.bundle?platform=android', '/sign-in', '/mobile-other']) {
    assert.deepEqual(request(path), { passedThrough: true });
  }
});

test('path cannot redirect to an attacker-controlled host', () => {
  assert.equal(request('/mobile//other.example/path').headers.Location,
    'https://preview.example.test//other.example/path');
});

test('missing Expo domain fails explicitly instead of looping or taking over root', () => {
  assert.equal(request('/mobile/', '').status, 503);
  assert.deepEqual(request('/', ''), { passedThrough: true });
});
