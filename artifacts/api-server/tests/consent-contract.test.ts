import assert from "node:assert/strict";
import test from "node:test";
import {
  AcceptLegalConsentBody, CreateBillingCheckoutBody, RecordLearningRoundBody, UpdateLearningProgressBody,
} from "@workspace/api-zod";

const checkout = {
  successUrl: "https://example.com/parent?checkout=success",
  cancelUrl: "https://example.com/parent?checkout=cancelled",
  privacyAccepted: true, disclaimerAccepted: true, noRefundAccepted: true,
  policyVersion: "2026-10-29",
};

test("checkout requires every acknowledgment, explicitly true, for the current policy", () => {
  assert.equal(CreateBillingCheckoutBody.safeParse(checkout).success, true);
  for (const field of ["privacyAccepted", "disclaimerAccepted", "noRefundAccepted"]) {
    assert.equal(CreateBillingCheckoutBody.safeParse({ ...checkout, [field]: false }).success, false);
    assert.equal(CreateBillingCheckoutBody.safeParse({ ...checkout, [field]: undefined }).success, false);
  }
  assert.equal(CreateBillingCheckoutBody.safeParse({ ...checkout, policyVersion: "outdated" }).success, false);
});

test("account consent requires adulthood and both document acknowledgments", () => {
  const consent = { privacyAccepted: true, disclaimerAccepted: true, adultConfirmed: true, policyVersion: "2026-10-29" };
  assert.equal(AcceptLegalConsentBody.safeParse(consent).success, true);
  for (const field of ["privacyAccepted", "disclaimerAccepted", "adultConfirmed"]) {
    assert.equal(AcceptLegalConsentBody.safeParse({ ...consent, [field]: false }).success, false);
  }
});

test("all four stages are selectable without an XP prerequisite", () => {
  for (const selectedStage of [1, 2, 3, 4]) {
    assert.equal(UpdateLearningProgressBody.safeParse({ selectedStage }).success, true);
  }
  for (const selectedStage of [0, 5, 1.5]) {
    assert.equal(UpdateLearningProgressBody.safeParse({ selectedStage }).success, false);
  }
});

test("rounds are bounded and all five modes are accepted", () => {
  const round = { stage: 4, roundId: "test-round-unique", correctCount: 5 };
  for (const mode of ["match", "pinyin", "listen", "word-order", "sentence-order"]) {
    assert.equal(RecordLearningRoundBody.safeParse({ ...round, mode }).success, true);
  }
  for (const correctCount of [-1, 6, 1.1]) {
    assert.equal(RecordLearningRoundBody.safeParse({ ...round, mode: "match", correctCount }).success, false);
  }
});
