import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";

const result = await build({
  entryPoints: [new URL("../src/stripe-customer-state.ts", import.meta.url).pathname],
  bundle: true, platform: "node", format: "esm", write: false,
});
const { StripeRequestError, customerExistsInMode } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

test("a missing customer permits renewal without granting membership", async () => {
  assert.equal(await customerExistsInMode(async () => {
    throw new StripeRequestError("missing", 404, "resource_missing");
  }, false), false);
});
test("test and live customers cannot cross modes", async () => {
  assert.equal(await customerExistsInMode(async () => ({ id: "test", livemode: false }), false), true);
  assert.equal(await customerExistsInMode(async () => ({ id: "live", livemode: true }), false), false);
  assert.equal(await customerExistsInMode(async () => ({ id: "test", livemode: false }), true), false);
  assert.equal(await customerExistsInMode(async () => ({ id: "deleted", deleted: true }), false), false);
});
test("outages and permission errors do not masquerade as missing customers", async () => {
  for (const error of [new Error("network"), new StripeRequestError("denied", 403), new StripeRequestError("server", 500)]) {
    await assert.rejects(customerExistsInMode(async () => { throw error; }, false), (caught) => caught === error);
  }
});

const readBuild = await build({
  entryPoints: [new URL("../src/in-flight-requests.ts", import.meta.url).pathname],
  bundle: true, platform: "node", format: "esm", write: false,
});
const { createReadCache, createReadDeduplicator } = await import(
  `data:text/javascript;base64,${Buffer.from(readBuild.outputFiles[0].text).toString("base64")}`
);
test("concurrent reads share work but completed membership results are not cached", async () => {
  const read = createReadDeduplicator();
  let calls = 0;
  const operation = async () => ++calls;
  assert.deepEqual(await Promise.all([read("same", operation), read("same", operation)]), [1, 1]);
  assert.equal(await read("same", operation), 2);
  await assert.rejects(read("failed", async () => { throw new Error("outage"); }));
  assert.equal(await read("failed", operation), 3);
});

test("short-lived read cache shares in-flight work and expires completed values", async () => {
  const cache = createReadCache(10);
  let calls = 0;
  const operation = async () => ++calls;
  assert.deepEqual(await Promise.all([cache("config", operation), cache("config", operation)]), [1, 1]);
  assert.equal(await cache("config", operation), 1);
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(await cache("config", operation), 2);
});

test("short-lived read cache can avoid caching negative results and errors", async () => {
  const cache = createReadCache(1000, (exists) => exists);
  let calls = 0;
  assert.equal(await cache("missing", async () => { calls++; return false; }), false);
  assert.equal(await cache("missing", async () => { calls++; return true; }), true);
  assert.equal(await cache("missing", async () => { calls++; return false; }), true);
  await assert.rejects(cache("error", async () => { throw new Error("upstream unavailable"); }));
  assert.equal(await cache("error", async () => { calls++; return true; }), true);
  assert.equal(calls, 3);
});
