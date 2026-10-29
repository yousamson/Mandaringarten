/**
 * Test-only replacement for Clerk's request helper.
 *
 * The integration harness verifies its own short-lived, signed synthetic
 * session tokens before setting req.testAuth. This module is only bundled
 * into the temporary test router and is never part of the server build.
 */
export function getAuth(req) {
  return req.testAuth ?? { userId: null };
}

export const clerkClient = {
  users: {
    async getUser() {
      throw new Error('The progress integration suite must not call Clerk.');
    },
  },
};
