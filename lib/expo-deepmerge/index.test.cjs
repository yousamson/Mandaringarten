const test = require("node:test");
const assert = require("node:assert/strict");
const merge = require("./index.cjs");

test("merges nested config and concatenates cloned arrays without mutating inputs", () => {
  const target = { ios: { supportsTablet: true }, plugins: [{ name: "existing" }] };
  const source = { ios: { bundleIdentifier: "example.app" }, plugins: ["new"] };
  const result = merge(target, source);
  assert.deepEqual(result, {
    ios: { supportsTablet: true, bundleIdentifier: "example.app" },
    plugins: [{ name: "existing" }, "new"],
  });
  result.plugins[0].name = "changed";
  assert.equal(target.plugins[0].name, "existing");
  assert.deepEqual(source.plugins, ["new"]);
});

test("honors Expo's custom deduplicating array merge for updates", () => {
  const arrayMerge = (target, source) => [...new Set([...target, ...source])];
  assert.deepEqual(
    merge({ headers: ["a"] }, { headers: ["a", "b"] }, { arrayMerge }),
    { headers: ["a", "b"] },
  );
});

test("preserves replacement values, dates, and enumerable symbols", () => {
  const key = Symbol("config");
  const date = new Date();
  const result = merge({ value: [1], date, [key]: { a: 1 } }, {
    value: null, date, [key]: { b: 2 },
  });
  assert.equal(result.value, null);
  assert.equal(result.date, date);
  assert.deepEqual(result[key], { a: 1, b: 2 });
});

test("does not let untrusted own __proto__ keys poison returned objects", () => {
  for (const source of [
    JSON.parse('{"__proto__":{"poisoned":true},"name":"safe"}'),
    JSON.parse('{"nested":{"__proto__":{"poisoned":true}}}'),
    JSON.parse('{"items":[{"__proto__":{"poisoned":true}}]}'),
  ]) {
    const result = merge({}, source);
    assert.equal(Object.getPrototypeOf(result), Object.prototype);
    assert.equal(result.poisoned, undefined);
    assert.equal(result.nested?.poisoned, undefined);
    assert.equal(result.items?.[0]?.poisoned, undefined);
  }
  assert.equal({}.poisoned, undefined);
});

test("rejects unsupported options instead of silently changing behavior", () => {
  assert.throws(() => merge({}, {}, { clone: false }), /Unsupported/);
  assert.throws(() => merge({}, {}, { arrayMerge: true }), /must be a function/);
});
