import assert from "node:assert/strict";
import { test, after } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { build } from "esbuild";

const directory = await mkdtemp(path.join(tmpdir(), "garden-public-plan-"));
const output = path.join(directory, "client.mjs");
await build({
  entryPoints: [fileURLToPath(new URL("../../../lib/api-client-react/src/custom-fetch.ts", import.meta.url))],
  outfile: output,
  bundle: true,
  platform: "node",
  format: "esm",
});
const { customFetch, setAuthTokenGetter, setBaseUrl } = await import(pathToFileURL(output));
const originalFetch = globalThis.fetch;
after(async () => {
  globalThis.fetch = originalFetch;
  setAuthTokenGetter(null);
  setBaseUrl(null);
  await rm(directory, { recursive: true, force: true });
});

test("public plan loads even when session token refresh rejects; protected requests remain authenticated", async () => {
  setBaseUrl("https://garden.example");
  let tokenCalls = 0;
  let received;
  globalThis.fetch = async (url, options) => {
    received = { url, options };
    return new Response(JSON.stringify({ priceLabel: "US$9.99" }), {
      headers: { "content-type": "application/json" },
    });
  };
  setAuthTokenGetter(async () => {
    tokenCalls++;
    throw new Error("Session refresh failed");
  });
  const plan = await customFetch("/api/billing/plan", { skipAuth: true, cache: "no-store" });
  assert.equal(plan.priceLabel, "US$9.99");
  assert.equal(tokenCalls, 0);
  assert.equal(received.options.headers.has("authorization"), false);
  assert.equal(received.options.cache, "no-store");
  assert.equal("skipAuth" in received.options, false);
  await assert.rejects(customFetch("/api/account/access"), /Session refresh failed/);
  assert.equal(tokenCalls, 1);
  setAuthTokenGetter(async () => "test-token");
  await customFetch("/api/account/access");
  assert.equal(received.options.headers.get("authorization"), "Bearer test-token");
});

test("GET retries a conditional 304 once without validators", async () => {
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls++;
    if (calls === 1) {
      assert.equal(options.headers.get("if-none-match"), '"cached-plan"');
      return new Response(null, { status: 304 });
    }
    assert.equal(options.headers.has("if-none-match"), false);
    assert.equal(options.headers.has("if-modified-since"), false);
    assert.equal(options.cache, "no-store");
    return new Response(JSON.stringify({ priceLabel: "US$9.99" }), {
      headers: { "content-type": "application/json" },
    });
  };

  const plan = await customFetch("/api/billing/plan", {
    skipAuth: true,
    cache: "no-store",
    headers: { "If-None-Match": '"cached-plan"' },
  });
  assert.equal(calls, 2);
  assert.equal(plan.priceLabel, "US$9.99");
});
