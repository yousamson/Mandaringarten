import test from "node:test";
import assert from "node:assert/strict";
import { DeleteAccountBody, CreateSupportThreadBody, SendSupportMessageBody } from "@workspace/api-zod";

test("deletion requires every explicit acknowledgment and exact typed confirmation", () => {
  const valid = { dataDeletionAccepted: true, noRefundAccepted: true, subscriptionCancellationAccepted: true, confirmation: "DELETE" };
  assert.equal(DeleteAccountBody.safeParse(valid).success, true);
  for (const key of ["dataDeletionAccepted", "noRefundAccepted", "subscriptionCancellationAccepted"] as const) {
    assert.equal(DeleteAccountBody.safeParse({ ...valid, [key]: false }).success, false);
    const missing: Record<string, unknown> = { ...valid };
    delete missing[key];
    assert.equal(DeleteAccountBody.safeParse(missing).success, false);
  }
  for (const confirmation of ["delete", "", "DELETE "]) {
    assert.equal(DeleteAccountBody.safeParse({ ...valid, confirmation }).success, false);
  }
});

test("messages enforce limits and cannot set server-owned identity or author role", () => {
  assert.equal(CreateSupportThreadBody.safeParse({ subject: "Help", text: "Question" }).success, true);
  assert.equal(CreateSupportThreadBody.safeParse({ subject: "x".repeat(121), text: "Question" }).success, false);
  assert.equal(SendSupportMessageBody.safeParse({ text: "x".repeat(5001) }).success, false);
  const parsed = SendSupportMessageBody.parse({ text: "Hello", author: "team", authorId: "another-user" });
  assert.deepEqual(parsed, { text: "Hello" });
});
