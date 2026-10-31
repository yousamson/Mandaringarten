import assert from 'node:assert/strict';
import test from 'node:test';
import { getClerkProxyHost } from '../src/middlewares/clerkProxyMiddleware.ts';

const backendHost = 'mandarin-garden.replit.app';
const siteHost = 'mandaringarden.asia';
const edgeHeaders = { host: backendHost, 'x-forwarded-host': backendHost };

test('registered site origin survives the edge replacing forwarded host', () => {
  assert.equal(getClerkProxyHost({ headers: {
    ...edgeHeaders,
    'x-mandarin-public-origin': `https://${siteHost}`,
    origin: `https://${siteHost}`,
  } }), siteHost);
});

test('originless OAuth callbacks retain the registered site host', () => {
  assert.equal(getClerkProxyHost({ headers: {
    ...edgeHeaders,
    'x-mandarin-public-origin': `https://${siteHost}`,
  } }), siteHost);
});

test('untrusted or malformed public origins cannot override the edge host', () => {
  for (const value of [
    'https://attacker.example',
    'https://mandaringarden.asia.attacker.example',
    'https://attacker-mandaringarden.asia',
    'http://mandaringarden.asia',
    'https://mandaringarden.asia:8443',
    'https://mandaringarden.asia/path',
    'https://user:pass@mandaringarden.asia',
    'https://mandarin-garden-mobile-pwa.pages.dev',
    'not-a-url',
    [`https://${siteHost}`, 'https://attacker.example'],
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
    'x-mandarin-public-origin': `https://${backendHost}`,
  } }), 'mandaringarden.asia');
});
