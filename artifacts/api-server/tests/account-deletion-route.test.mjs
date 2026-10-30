import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";
import { build } from "esbuild";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(testDir, "..");
const tempDir = await mkdtemp(path.join(packageDir, ".account-deletion-route-test-"));

const stubs = {
  auth: `export function getAuth(req) { return { userId: req.testUserId ?? null }; }`,
  apiZod: `
    export const DeleteAccountBody = {
      safeParse(value) {
        return value?.privacyAccepted && value?.disclaimerAccepted &&
          value?.dataDeletionAccepted && value?.noRefundAccepted &&
          value?.subscriptionCancellationAccepted && value?.confirmation === "DELETE"
          ? { success: true, data: value } : { success: false };
      },
    };
  `,
  db: `
    const defineTable = (name, columns) => {
      const table = { __name: name };
      for (const column of columns) table[column] = { __table: name, __column: column };
      return table;
    };
    export const accountDeletionsTable = defineTable("deletions", ["accountHash", "completed"]);
    export const billingAccountsTable = defineTable("billingAccounts", ["clerkUserId", "stripeCustomerId"]);
    export const billingCustomersTable = defineTable("billingCustomers", ["clerkUserId", "stripeCustomerId"]);
    export const billingCustomerScopesTable = defineTable("billingScopes", ["clerkUserId", "stripeScope", "stripeCustomerId"]);
    export const learningChallengesTable = defineTable("challenges", ["clerkUserId"]);
    export const learningProgressTable = defineTable("progress", ["clerkUserId"]);
    export const learningRoundsTable = defineTable("rounds", ["clerkUserId"]);
    export const legalConsentsTable = defineTable("legalConsents", ["clerkUserId"]);
    export const checkoutConsentsTable = defineTable("checkoutConsents", ["clerkUserId"]);
    export const supportThreadsTable = defineTable("supportThreads", ["id", "clerkUserId", "lastMessagePreview"]);
    export const supportMessagesTable = defineTable("supportMessages", ["id", "threadId", "authorId", "text", "createdAt"]);
    const state = () => globalThis.__accountDeletionTestState;
    const matches = (row, predicate) => {
      if (!predicate) return true;
      if (predicate.kind === "eq") return row[predicate.column.__column] === predicate.value;
      if (predicate.kind === "inArray") return predicate.values.includes(row[predicate.column.__column]);
      if (predicate.kind === "and") return predicate.parts.every((part) => matches(row, part));
      return true;
    };
    const projected = (row, selection) => {
      if (!selection) return row;
      return Object.fromEntries(Object.entries(selection).map(([key, column]) => [key, row[column.__column]]));
    };
    function query(selection) {
      let table;
      let predicate;
      const builder = {
        from(value) { table = value; return this; },
        where(value) { predicate = value; return this; },
        orderBy() { return this; },
        then(resolve, reject) {
          try {
            resolve(state().rows[table.__name].filter((row) => matches(row, predicate)).map((row) => projected(row, selection)));
          } catch (error) { reject(error); }
        },
        limit(count) {
          return Promise.resolve(state().rows[table.__name]
            .filter((row) => matches(row, predicate)).slice(0, count)
            .map((row) => projected(row, selection)));
        },
      };
      return builder;
    }
    function insert(table) {
      return {
        values(value) {
          return {
            onConflictDoNothing() {
              if (!state().rows[table.__name].some((row) => row.accountHash === value.accountHash)) {
                state().rows[table.__name].push({ completed: null, ...value });
              }
              return Promise.resolve();
            },
          };
        },
      };
    }
    function remove(table) {
      return {
        where(predicate) {
          state().rows[table.__name] = state().rows[table.__name]
            .filter((row) => !matches(row, predicate));
          return Promise.resolve();
        },
      };
    }
    function update(table) {
      return {
        set(values) {
          return {
            where(predicate) {
              for (const row of state().rows[table.__name]) {
                if (matches(row, predicate)) Object.assign(row, values);
              }
              return Promise.resolve();
            },
          };
        },
      };
    }
    export const db = {
      select: (selection) => query(selection),
      selectDistinct: (selection) => query(selection),
      insert,
      delete: remove,
      update,
      execute: async () => undefined,
      transaction: async (operation) => operation(db),
    };
  `,
  drizzle: `
    export const eq = (column, value) => ({ kind: "eq", column, value });
    export const inArray = (column, values) => ({ kind: "inArray", column, values });
    export const desc = (column) => ({ kind: "desc", column });
  `,
  lifecycle: `
    import { createHash } from "node:crypto";
    import { db, accountDeletionsTable } from "@workspace/db";
    import { eq } from "drizzle-orm";
    export const accountHash = (userId) => createHash("sha256").update(userId).digest("hex");
    export async function deletionState(userId) {
      return (await db.select().from(accountDeletionsTable)
        .where(eq(accountDeletionsTable.accountHash, accountHash(userId))).limit(1))[0];
    }
    export async function lockAccount(tx) { await tx.execute(); }
  `,
  admin: `export async function isAdministrator() { return false; }`,
  billing: `export async function hasPremiumMembership() { return false; }`,
  stripeCustomers: `export async function currentCustomerIds(_userId, ids) { return [...new Set(ids)]; }`,
  stripeClient: `
    export async function stripeRequest(endpoint, options = {}) {
      const state = globalThis.__accountDeletionTestState;
      const method = options.method ?? "GET";
      const url = new URL(endpoint, "https://stripe.test");
      const request = { method, pathname: url.pathname };
      state.stripeCalls.push(request);
      if (state.failOnce === request.method + " " + request.pathname) {
        state.failOnce = null;
        throw new Error("Injected Stripe failure: " + request.method + " " + request.pathname);
      }
      if (url.pathname === "/v1/customers/cus_fixture" && method === "GET") {
        return state.customerDeleted
          ? { id: "cus_fixture", deleted: true }
          : { id: "cus_fixture" };
      }
      if (url.pathname === "/v1/checkout/sessions" && method === "GET") {
        return { data: state.sessionStatus === "open" ? [{ id: "cs_fixture", status: "open" }] : [], has_more: false };
      }
      if (url.pathname === "/v1/checkout/sessions/cs_fixture/expire" && method === "POST") {
        state.sessionStatus = "expired";
        return { id: "cs_fixture", status: "expired" };
      }
      if (url.pathname === "/v1/subscriptions" && method === "GET") {
        return { data: state.subscriptionStatus === "active" ? [{ id: "sub_fixture", status: "active" }] : [], has_more: false };
      }
      if (url.pathname === "/v1/subscriptions/sub_fixture" && method === "DELETE") {
        state.subscriptionStatus = "canceled";
        return { id: "sub_fixture", status: "canceled" };
      }
      if (url.pathname === "/v1/customers/cus_fixture" && method === "DELETE") {
        state.customerDeleted = true;
        return { id: "cus_fixture", deleted: true };
      }
      throw new Error("Unexpected Stripe fixture request: " + method + " " + endpoint);
    }
  `,
  clerk: `
    export const clerkClient = {
      users: {
        async deleteUser(userId) {
          const state = globalThis.__accountDeletionTestState;
          state.identityDeleteCalls++;
          if (state.identityFailureCount > 0) {
            state.identityFailureCount--;
            throw new Error("Injected identity-provider failure");
          }
          state.deletedIdentity = userId;
        },
      },
    };
    export function getAuth(req) { return { userId: req.testUserId ?? null }; }
  `,
};

const stubPaths = {};
for (const [name, contents] of Object.entries(stubs)) {
  const stubPath = path.join(tempDir, `${name}.mjs`);
  await writeFile(stubPath, contents);
  stubPaths[name] = stubPath;
}

const routeBundlePath = path.join(tempDir, "account-route.mjs");
await build({
  entryPoints: [path.join(packageDir, "src/routes/account.ts")],
  outfile: routeBundlePath,
  bundle: true,
  platform: "node",
  format: "esm",
  external: ["express"],
  plugins: [{
    name: "account-route-test-dependencies",
    setup(buildApi) {
      const aliases = new Map([
        ["@clerk/express", stubPaths.clerk],
        ["@workspace/api-zod", stubPaths.apiZod],
        ["@workspace/db", stubPaths.db],
        ["drizzle-orm", stubPaths.drizzle],
        ["../account-lifecycle", stubPaths.lifecycle],
        ["../admin", stubPaths.admin],
        ["./billing", stubPaths.billing],
        ["../stripeClient", stubPaths.stripeClient],
        ["../stripe-customers", stubPaths.stripeCustomers],
      ]);
      buildApi.onResolve({ filter: /.*/ }, (args) => {
        const stubPath = aliases.get(args.path);
        return stubPath ? { path: stubPath } : undefined;
      });
    },
  }],
});

const { default: accountRouter } = await import(pathToFileURL(routeBundlePath).href);
const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.testUserId = "parent_test_fixture";
  req.log = { error() {} };
  next();
});
app.use("/api", accountRouter);
const server = app.listen(0);
await new Promise((resolve, reject) => {
  server.once("listening", resolve);
  server.once("error", reject);
});
const baseUrl = `http://127.0.0.1:${server.address().port}`;
const validAcknowledgments = {
  privacyAccepted: true,
  disclaimerAccepted: true,
  dataDeletionAccepted: true,
  noRefundAccepted: true,
  subscriptionCancellationAccepted: true,
  confirmation: "DELETE",
};

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  delete globalThis.__accountDeletionTestState;
  await rm(tempDir, { recursive: true, force: true });
});

function resetState({ failOnce = null, identityFailureCount = 0 } = {}) {
  globalThis.__accountDeletionTestState = {
    rows: {
      deletions: [],
      billingAccounts: [],
      billingCustomers: [{ clerkUserId: "parent_test_fixture", stripeCustomerId: "cus_fixture" }],
      billingScopes: [],
      challenges: [{ clerkUserId: "parent_test_fixture" }],
      progress: [{ clerkUserId: "parent_test_fixture" }],
      rounds: [{ clerkUserId: "parent_test_fixture" }],
      legalConsents: [{ clerkUserId: "parent_test_fixture" }],
      checkoutConsents: [{ clerkUserId: "parent_test_fixture" }],
      supportThreads: [],
      supportMessages: [],
    },
    failOnce,
    identityFailureCount,
    identityDeleteCalls: 0,
    deletedIdentity: null,
    customerDeleted: false,
    sessionStatus: "open",
    subscriptionStatus: "active",
    stripeCalls: [],
  };
  return globalThis.__accountDeletionTestState;
}

async function deleteAccount() {
  return fetch(`${baseUrl}/api/account`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(validAcknowledgments),
  });
}

async function assertRetryCompletes(state) {
  const failedResponse = await deleteAccount();
  assert.equal(failedResponse.status, 503);
  assert.equal((await failedResponse.json()).deleted, undefined);
  assert.equal(state.rows.deletions.length, 1);
  assert.equal(state.rows.deletions[0].completed, null);

  const accessResponse = await fetch(`${baseUrl}/api/account/access`);
  assert.equal(accessResponse.status, 200);
  assert.deepEqual(await accessResponse.json(), {
    isAdmin: false,
    isPremium: false,
    access: "deleting",
  });

  const retryResponse = await deleteAccount();
  assert.equal(retryResponse.status, 200);
  assert.deepEqual(await retryResponse.json(), { deleted: true });
  assert.ok(state.rows.deletions[0].completed instanceof Date);
  assert.equal(state.deletedIdentity, "parent_test_fixture");
  for (const table of [
    "billingAccounts", "billingCustomers", "billingScopes", "challenges",
    "progress", "rounds", "legalConsents", "checkoutConsents",
  ]) {
    assert.equal(state.rows[table].length, 0, `${table} should be removed`);
  }
}

for (const [label, failOnce] of [
  ["customer lookup", "GET /v1/customers/cus_fixture"],
  ["checkout session listing", "GET /v1/checkout/sessions"],
  ["checkout session expiration", "POST /v1/checkout/sessions/cs_fixture/expire"],
  ["subscription listing", "GET /v1/subscriptions"],
  ["subscription cancellation", "DELETE /v1/subscriptions/sub_fixture"],
  ["customer removal", "DELETE /v1/customers/cus_fixture"],
]) {
  test(`a Stripe failure during ${label} leaves deletion retryable and incomplete`, async () => {
    const state = resetState({ failOnce });
    await assertRetryCompletes(state);
    assert.ok(state.stripeCalls.length > 1, "the retry should resume Stripe cleanup");
  });
}

test("an identity-provider failure leaves local data removed but deletion retryable", async () => {
  const state = resetState({ identityFailureCount: 1 });
  await assertRetryCompletes(state);
  assert.equal(state.identityDeleteCalls, 2);
});

test("a repeated request after completion is idempotent", async () => {
  const state = resetState();
  const firstResponse = await deleteAccount();
  assert.equal(firstResponse.status, 200);
  assert.deepEqual(await firstResponse.json(), { deleted: true });
  const callsBeforeRepeat = state.stripeCalls.length;
  const secondResponse = await deleteAccount();
  assert.equal(secondResponse.status, 200);
  assert.deepEqual(await secondResponse.json(), { deleted: true });
  assert.equal(state.stripeCalls.length, callsBeforeRepeat);
  assert.equal(state.identityDeleteCalls, 1);
});
