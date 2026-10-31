import assert from 'node:assert/strict';
import test from 'node:test';
import { withAbortTimeout } from '../src/lib/with-abort-timeout.ts';

test('account access requests abort when the timeout expires', async () => {
  const parent = new AbortController();
  await assert.rejects(
    withAbortTimeout(parent.signal, 10, (signal) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    })),
    { name: 'TimeoutError' },
  );
});

test('account access requests still respect query cancellation', async () => {
  const parent = new AbortController();
  const pending = withAbortTimeout(parent.signal, 1000, (signal) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }));
  parent.abort(new DOMException('Query cancelled.', 'AbortError'));
  await assert.rejects(pending, { name: 'AbortError' });
});
