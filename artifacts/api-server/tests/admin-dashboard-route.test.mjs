import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";
import { build } from "esbuild";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(testDir, "..");
const tempDir = await mkdtemp(path.join(packageDir, ".admin-dashboard-test-"));
const state = { isAdmin: false, userListCalls: 0, inserts: 0, errors: [] };
globalThis.__adminDashboardTestState = state;
process.env.MANDARIN_ADMIN_EMAILS = "team@example.test";

const stubs = {
  clerk: `
    export function getAuth(req) { return { userId: req.headers['x-test-user'] ?? null }; }
    export const clerkClient = { users: { async getUserList() {
      globalThis.__adminDashboardTestState.userListCalls++;
      return {
        totalCount: 2,
        data: [
          {
            id: "admin-user",
            emailAddresses: [{ id: "admin-email", emailAddress: "team@example.test", verification: { status: "verified" } }],
            primaryEmailAddressId: "admin-email",
            firstName: null,
            lastName: null,
            createdAt: 1795000000000,
          },
          {
            id: "parent-user",
            emailAddresses: [{ id: "parent-email", emailAddress: "parent@example.test", verification: { status: "verified" } }],
            primaryEmailAddressId: "parent-email",
            firstName: "Parent",
            lastName: "One",
            createdAt: 1795000000000,
          },
        ],
      };
    } } };
  `,
  admin: `
    export function hasVerifiedAdministratorEmail(emails, allowed) {
      return emails.some((email) => email.verification?.status === "verified" &&
        allowed.has(email.emailAddress.trim().toLowerCase()));
    }
    export async function isAdministrator(userId) {
      return globalThis.__adminDashboardTestState.isAdmin && userId === "admin-id";
    }
  `,
  apiZod: `
    export const GetAdminDashboardQueryParams = { safeParse(value) {
      const offset = Number(value.offset ?? 0);
      const limit = Number(value.limit ?? 25);
      return Number.isInteger(offset) && offset >= 0 && Number.isInteger(limit) && limit >= 1 && limit <= 50
        ? { success: true, data: { offset, limit } } : { success: false };
    } };
    export const GetAdminDashboardResponse = { parse(value) {
      return { ...value, dailyPageViews: value.dailyPageViews.map((row) => ({ ...row, date: new Date(row.date) })) };
    } };
  `,
  db: `
    export const sitePageViewsTable = { day: {}, pageViews: {} };
    export const db = {
      insert() { return { values() { globalThis.__adminDashboardTestState.inserts++; return { onConflictDoUpdate() { return Promise.resolve(); } }; } }; },
      select(selection) {
        const builder = {
          from() { return this; },
          where() { return this; },
          orderBy() { return this; },
          then(resolve, reject) {
            try {
              resolve(selection?.total ? [{ total: 5 }] : [{ date: "2026-11-10", pageViews: 5 }]);
            } catch (error) { reject(error); }
          },
        };
        return builder;
      },
    };
  `,
  drizzle: `
    export const asc = () => ({});
    export const desc = () => ({});
    export const sql = () => ({});
  `,
};
const stubPaths = {};
for (const [name, contents] of Object.entries(stubs)) {
  const file = path.join(tempDir, `${name}.mjs`);
  await writeFile(file, contents);
  stubPaths[name] = file;
}

const routePath = path.join(tempDir, "admin-dashboard-route.mjs");
await build({
  entryPoints: [path.join(packageDir, "src/routes/admin-dashboard.ts")],
  outfile: routePath,
  bundle: true,
  platform: "node",
  format: "esm",
  external: ["express"],
  plugins: [{
    name: "admin-dashboard-test-dependencies",
    setup(buildApi) {
      const aliases = new Map([
        ["@clerk/express", stubPaths.clerk],
        ["drizzle-orm", stubPaths.drizzle],
        ["@workspace/db", stubPaths.db],
        ["@workspace/api-zod", stubPaths.apiZod],
        ["../admin", stubPaths.admin],
      ]);
      buildApi.onResolve({ filter: /.*/ }, (args) => aliases.has(args.path)
        ? { path: aliases.get(args.path), external: true } : undefined);
    },
  }],
});
const { default: router } = await import(pathToFileURL(routePath).href);
const app = express();
app.use((req, _res, next) => {
  req.log = { error: (context) => state.errors.push(context?.err?.message ?? "unknown test error") };
  next();
});
app.use("/api", router);
const server = app.listen(0);
await new Promise((resolve) => server.once("listening", resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}/api`;

after(async () => {
  server.close();
  await rm(tempDir, { recursive: true, force: true });
});

test("dashboard requires authentication", async () => {
  const response = await fetch(`${baseUrl}/admin/dashboard`);
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("a signed-in non-admin cannot read member records", async () => {
  state.isAdmin = false;
  const response = await fetch(`${baseUrl}/admin/dashboard`, {
    headers: { "x-test-user": "member-id" },
  });
  assert.equal(response.status, 403);
  assert.equal(state.userListCalls, 0);
});

test("administrator dashboard never returns the designated login email", async () => {
  state.isAdmin = true;
  state.errors = [];
  const response = await fetch(`${baseUrl}/admin/dashboard?offset=0&limit=10`, {
    headers: { "x-test-user": "admin-id" },
  });
  assert.equal(response.status, 200, state.errors.join("; "));
  const body = await response.json();
  assert.equal(body.memberCount, 2);
  assert.equal(body.totalPageViews, 5);
  assert.equal(body.members[0].email, null);
  assert.equal(body.members[0].name, "Mandarin Garden team");
  assert.equal(body.members[1].email, "parent@example.test");
  assert.equal(JSON.stringify(body).includes("team@example.test"), false);
});

test("a page view from an unrecognized origin is ignored", async () => {
  const response = await fetch(`${baseUrl}/analytics/page-view`, {
    method: "POST",
    headers: { origin: "https://attacker.example" },
  });
  assert.equal(response.status, 204);
  assert.equal(state.inserts, 0);
});

test("an allowed website origin records an aggregate view", async () => {
  const response = await fetch(`${baseUrl}/analytics/page-view`, {
    method: "POST",
    headers: { origin: "https://www.mandaringarden.asia" },
  });
  assert.equal(response.status, 204);
  assert.equal(state.inserts, 1);
});
