import assert from 'node:assert/strict';
import test from 'node:test';
import { getClerkProxyHost } from '../src/middlewares/clerkProxyMiddleware.ts';

const backendHost = 'mandarin-garden.replit.app';
const pagesHost = 'mandarin-garden-mobile-pwa.pages.dev';
const edgeHeaders = { host: backendHost, 'x-forwarded-host': backendHost };

test('Pages origin survives the edge replacing forwarded host', () => {
  for (const host of [pagesHost, `branch-name.${pagesHost}`]) {
    assert.equal(getClerkProxyHost({ headers: {
      ...edgeHeaders,
      'x-mandarin-public-origin': `https://${host}`,
      origin: `https://${host}`,
    } }), host);
  }
});

test('originless OAuth callbacks retain the Pages host', () => {
  assert.equal(getClerkProxyHost({ headers: {
    ...edgeHeaders,
    'x-mandarin-public-origin': `https://${pagesHost}`,
  } }), pagesHost);
});

test('untrusted or malformed public origins cannot override the edge host', () => {
  for (const value of [
    'https://attacker.example',
    `https://${pagesHost}.attacker.example`,
    `https://attacker-${pagesHost}`,
    `http://${pagesHost}`,
    `https://${pagesHost}:8443`,
    `https://${pagesHost}/path`,
    `https://user:pass@${pagesHost}`,
    'not-a-url',
    [`https://${pagesHost}`, 'https://attacker.example'],
  ]) {
    assert.equal(getClerkProxyHost({ headers: {
      ...edgeHeaders,
      'x-mandarin-public-origin': value,
    } }), backendHost);
  }
});

test('existing custom domains and forwarded-host lists remain unchanged', () => {
  assert.equal(getClerkProxyHost({ headers: {
    host: backendHost,
    'x-forwarded-host': 'mandaringarden.asia, proxy.example',
  } }), 'mandaringarden.asia');
  assert.equal(getClerkProxyHost({ headers: { host: 'localhost:8080' } }), 'localhost:8080');
  assert.equal(getClerkProxyHost({ headers: {
    host: 'mandaringarden.asia',
    'x-mandarin-public-origin': `https://${pagesHost}`,
  } }), 'mandaringarden.asia');
});
