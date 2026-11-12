import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";
import { build } from "esbuild";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(testDir, "..");
const tempDir = await mkdtemp(path.join(packageDir, ".admin-dashboard-password-test-"));
const state = {
  isAdmin: false,
  credential: null,
  authenticated: false,
  failedAttempts: 0,
  sessionRevocations: 0,
  passwordHashSequence: 0,
  errors: [],
};
globalThis.__adminDashboardPasswordTestState = state;

const stubs = {
  clerk: `export function getAuth(req) { return { userId: req.headers["x-test-user"] ?? null }; }`,
  admin: `export async function isAdministrator(userId) { return globalThis.__adminDashboardPasswordTestState.isAdmin && userId === "admin-id"; }`,
  db: `
    export const adminDashboardCredentialsTable = {
      id: { column: "id" }, passwordVersion: { column: "passwordVersion" },
      lockedUntil: { column: "lockedUntil" }, failedAttempts: { column: "failedAttempts" },
    };
    const state = () => globalThis.__adminDashboardPasswordTestState;
    export const db = {
      select() {
        let table;
        const builder = {
          from(value) { table = value; return this; },
          where() { return this; },
          limit() { return Promise.resolve(table === adminDashboardCredentialsTable && state().credential ? [state().credential] : []); },
        };
        return builder;
      },
      insert(table) {
        let values;
        return {
          values(input) { values = input; return this; },
          onConflictDoNothing() { return this; },
          async returning() {
            if (table !== adminDashboardCredentialsTable || state().credential) return [];
            state().credential = { ...values, updatedAt: new Date() };
            return [state().credential];
          },
        };
      },
      update(table) {
        let values;
        return {
          set(input) { values = input; return this; },
          where() { return this; },
          async returning() {
            if (table !== adminDashboardCredentialsTable || !state().credential) return [];
            state().credential = { ...state().credential, ...values };
            return [state().credential];
          },
        };
      },
    };
  `,
  drizzle: `
    export const eq = (column, value) => ({ column, value });
    export const and = (...conditions) => conditions;
  `,
  apiZod: `
    const obj = (value) => value && typeof value === "object" ? value : {};
    const status = { parse: (value) => value };
    export const GetAdminDashboardPasswordStatusResponse = status;
    export const SetupAdminDashboardPasswordResponse = status;
    export const CreateAdminDashboardPasswordSessionResponse = status;
    export const UpdateAdminDashboardPasswordResponse = status;
    export const SetupAdminDashboardPasswordBody = { safeParse(value) {
      const body = obj(value);
      return typeof body.password === "string" && body.password.length >= 8 && body.password.length <= 128 &&
        typeof body.confirmation === "string" && body.confirmation.length >= 8 && body.confirmation.length <= 128
        ? { success: true, data: body } : { success: false };
    } };
    export const CreateAdminDashboardPasswordSessionBody = { safeParse(value) {
      const body = obj(value);
      return typeof body.password === "string" && body.password.length > 0 && body.password.length <= 128
        ? { success: true, data: body } : { success: false };
    } };
    export const UpdateAdminDashboardPasswordBody = { safeParse(value) {
      const body = obj(value);
      return typeof body.currentPassword === "string" && body.currentPassword.length > 0 &&
        typeof body.password === "string" && body.password.length >= 8 && body.password.length <= 128 &&
        typeof body.confirmation === "string" && body.confirmation.length >= 8 && body.confirmation.length <= 128
        ? { success: true, data: body } : { success: false };
    } };
  `,
  passwordService: `
    const state = () => globalThis.__adminDashboardPasswordTestState;
    export function clearAdminDashboardPasswordCookie(res) { res.setHeader("Set-Cookie", "test=; Max-Age=0"); }
    export async function getAdminDashboardCredential() { return state().credential ?? undefined; }
    export async function getAdminDashboardPasswordStatus() {
      return { passwordConfigured: Boolean(state().credential), passwordAuthenticated: state().authenticated };
    }
    export async function requireAdminDashboardPasswordSession(_userId, _req, res) {
      if (!state().credential) { res.status(428).json({ error: "Set password." }); return false; }
      if (!state().authenticated) { res.status(423).json({ error: "Unlock dashboard." }); return false; }
      return true;
    }
    export async function hashAdminDashboardPassword(password) {
      state().passwordHashSequence++;
      return { passwordSalt: "salt-" + state().passwordHashSequence, passwordHash: "hash:" + password };
    }
    export async function verifyAdminDashboardPassword(password, _salt, expectedHash) {
      return expectedHash === "hash:" + password;
    }
    export async function registerFailedAdminDashboardPasswordAttempt() {
      state().failedAttempts++;
      if (state().failedAttempts >= 5 && state().credential) {
        state().credential.lockedUntil = new Date(Date.now() + 15 * 60_000);
      }
    }
    export async function createAdminDashboardPasswordSession(_userId, credential, res) {
      state().authenticated = true;
      state().credential = credential;
      res.setHeader("Set-Cookie", "test=opaque; HttpOnly");
    }
    export async function deleteAdminDashboardPasswordSession() { state().authenticated = false; }
    export async function revokeAdminDashboardPasswordSessions() {
      state().sessionRevocations++;
      state().authenticated = false;
    }
  `,
  passwordCrypto: `
    export const hashAdminDashboardPassword = async (password) => {
      const state = globalThis.__adminDashboardPasswordTestState;
      state.passwordHashSequence++;
      return { passwordSalt: "salt-" + state.passwordHashSequence, passwordHash: "hash:" + password };
    };
    export const verifyAdminDashboardPassword = async (password, _salt, hash) => hash === "hash:" + password;
  `,
};
const stubPaths = {};
for (const [name, contents] of Object.entries(stubs)) {
  const file = path.join(tempDir, `${name}.mjs`);
  await writeFile(file, contents);
  stubPaths[name] = file;
}

const routePath = path.join(tempDir, "admin-dashboard-password-route.mjs");
await build({
  entryPoints: [path.join(packageDir, "src/routes/admin-dashboard-password.ts")],
  outfile: routePath,
  bundle: true,
  platform: "node",
  format: "esm",
  external: ["express"],
  plugins: [{
    name: "admin-dashboard-password-test-dependencies",
    setup(buildApi) {
      const aliases = new Map([
        ["@clerk/express", stubPaths.clerk],
        ["@workspace/db", stubPaths.db],
        ["@workspace/api-zod", stubPaths.apiZod],
        ["drizzle-orm", stubPaths.drizzle],
        ["../admin", stubPaths.admin],
        ["../admin-dashboard-password", stubPaths.passwordService],
        ["../admin-dashboard-password-crypto", stubPaths.passwordCrypto],
      ]);
      buildApi.onResolve({ filter: /.*/ }, (args) => aliases.has(args.path)
        ? { path: aliases.get(args.path), external: true } : undefined);
    },
  }],
});
const { default: router } = await import(pathToFileURL(routePath).href);
const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.log = { error: (context) => state.errors.push(context?.err?.message ?? "unknown test error") };
  next();
});
app.use("/api", router);
const server = app.listen(0);
await new Promise((resolve) => server.once("listening", resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}/api/admin/dashboard/password`;
const adminHeaders = {
  "content-type": "application/json",
  origin: "https://www.mandaringarden.asia",
  "x-test-user": "admin-id",
};

function reset({ isAdmin = true, credential = null, authenticated = false } = {}) {
  Object.assign(state, {
    isAdmin,
    credential,
    authenticated,
    failedAttempts: 0,
    sessionRevocations: 0,
    passwordHashSequence: 0,
    errors: [],
  });
}

after(async () => {
  server.close();
  delete globalThis.__adminDashboardPasswordTestState;
  await rm(tempDir, { recursive: true, force: true });
});

test("password status and setup remain limited to the verified administrator", async () => {
  reset({ isAdmin: false });
  const denied = await fetch(`${baseUrl}/status`, { headers: { "x-test-user": "member-id" } });
  assert.equal(denied.status, 403);

  reset();
  const status = await fetch(`${baseUrl}/status`, { headers: { "x-test-user": "admin-id" } });
  assert.equal(status.status, 200);
  assert.deepEqual(await status.json(), { passwordConfigured: false, passwordAuthenticated: false });

  const unauthorized = await fetch(baseUrl, {
    method: "POST",
    headers: { ...adminHeaders, "x-test-user": "member-id" },
    body: JSON.stringify({ password: "long-admin-password", confirmation: "long-admin-password" }),
  });
  assert.equal(unauthorized.status, 403);
});

test("administrator initializes once, stores only a hash, and receives a private session", async () => {
  reset();
  const tooShort = await fetch(baseUrl, {
    method: "POST", headers: adminHeaders,
    body: JSON.stringify({ password: "short7!", confirmation: "short7!" }),
  });
  assert.equal(tooShort.status, 400);

  const mismatch = await fetch(baseUrl, {
    method: "POST", headers: adminHeaders,
    body: JSON.stringify({ password: "long-admin-password", confirmation: "different-password" }),
  });
  assert.equal(mismatch.status, 400);

  const response = await fetch(baseUrl, {
    method: "POST", headers: adminHeaders,
    body: JSON.stringify({ password: "eight888", confirmation: "eight888" }),
  });
  assert.equal(response.status, 200);
  assert.equal(state.credential.passwordHash, "hash:eight888");
  assert.notEqual(state.credential.passwordHash, "eight888");
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  assert.deepEqual(await response.json(), { passwordConfigured: true, passwordAuthenticated: true });

  const duplicate = await fetch(baseUrl, {
    method: "POST", headers: adminHeaders,
    body: JSON.stringify({ password: "another-long-password", confirmation: "another-long-password" }),
  });
  assert.equal(duplicate.status, 409);
});

test("password unlock rejects incorrect credentials and stops attempts during lockout", async () => {
  reset({ credential: {
    id: 1, passwordSalt: "salt", passwordHash: "hash:long-admin-password",
    passwordVersion: 1, failedAttempts: 0, lockedUntil: null,
  } });
  const wrong = await fetch(`${baseUrl}/session`, {
    method: "POST", headers: adminHeaders,
    body: JSON.stringify({ password: "incorrect-password" }),
  });
  assert.equal(wrong.status, 401);
  assert.equal(state.failedAttempts, 1);

  state.credential.lockedUntil = new Date(Date.now() + 60_000);
  const locked = await fetch(`${baseUrl}/session`, {
    method: "POST", headers: adminHeaders,
    body: JSON.stringify({ password: "long-admin-password" }),
  });
  assert.equal(locked.status, 429);
});

test("administrator changes the password only in an unlocked session and closes other sessions", async () => {
  reset({ credential: {
    id: 1, passwordSalt: "salt", passwordHash: "hash:long-admin-password",
    passwordVersion: 1, failedAttempts: 0, lockedUntil: null,
  } });
  const changeBody = {
    currentPassword: "long-admin-password",
    password: "another-long-password",
    confirmation: "another-long-password",
  };
  const locked = await fetch(baseUrl, {
    method: "PATCH", headers: adminHeaders, body: JSON.stringify(changeBody),
  });
  assert.equal(locked.status, 423);

  state.authenticated = true;
  const changed = await fetch(baseUrl, {
    method: "PATCH", headers: adminHeaders, body: JSON.stringify(changeBody),
  });
  assert.equal(changed.status, 200);
  assert.equal(state.credential.passwordHash, "hash:another-long-password");
  assert.equal(state.credential.passwordVersion, 2);
  assert.equal(state.sessionRevocations, 1);
  assert.equal(state.authenticated, true);
});

test("password mutations reject requests from an unknown website origin", async () => {
  reset();
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { ...adminHeaders, origin: "https://attacker.example" },
    body: JSON.stringify({ password: "long-admin-password", confirmation: "long-admin-password" }),
  });
  assert.equal(response.status, 403);
  assert.equal(state.credential, null);
});
