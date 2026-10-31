import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasVerifiedAdministratorEmail } from '../src/admin.ts';

test('a verified allowed email grants admin access even when it is secondary', () => {
  assert.equal(
    hasVerifiedAdministratorEmail([
      { emailAddress: 'parent@example.com', verification: { status: 'verified' } },
      { emailAddress: 'ADMIN@example.com', verification: { status: 'verified' } },
    ], new Set(['admin@example.com'])),
    true,
  );
});

test('an unverified allowed email does not grant admin access', () => {
  assert.equal(
    hasVerifiedAdministratorEmail([
      { emailAddress: 'admin@example.com', verification: { status: 'unverified' } },
    ], new Set(['admin@example.com'])),
    false,
  );
});

test('an email outside the administrator allowlist does not grant access', () => {
  assert.equal(
    hasVerifiedAdministratorEmail([
      { emailAddress: 'parent@example.com', verification: { status: 'verified' } },
    ], new Set(['admin@example.com'])),
    false,
  );
});
