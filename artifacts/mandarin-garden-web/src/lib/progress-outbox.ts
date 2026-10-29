import type { LearningRoundInput } from '@workspace/api-client-react';

export const OUTBOX_PREFIX = 'mg-pending-round:';
export const OUTBOX_EVENT = 'mg-progress-outbox';
const key = (uid: string, roundId: string) => `${OUTBOX_PREFIX}${uid}:${roundId}`;

/** A stable per-question event ID makes retries idempotent while XP is awarded immediately. */
export function questionAwardId(roundId: string, questionIndex: number): string {
  if (!Number.isInteger(questionIndex) || questionIndex < 0) {
    throw new RangeError('Question index must be a non-negative integer.');
  }
  return `${roundId}:answer:${questionIndex}`;
}

/** One key per round prevents different tabs from overwriting each other's queue. */
export function queueRound(uid: string, round: LearningRoundInput) {
  localStorage.setItem(key(uid, round.roundId), JSON.stringify(round));
  window.dispatchEvent(new Event(OUTBOX_EVENT));
}

export function acknowledgeRound(uid: string, roundId: string) {
  localStorage.removeItem(key(uid, roundId));
  window.dispatchEvent(new Event(OUTBOX_EVENT));
}

export function pendingRounds(uid: string): LearningRoundInput[] {
  const rounds: LearningRoundInput[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (!k?.startsWith(`${OUTBOX_PREFIX}${uid}:`)) continue;
    const value = JSON.parse(localStorage.getItem(k)!) as LearningRoundInput;
    if (!value || !Number.isInteger(value.stage) || value.stage < 1 || value.stage > 4 ||
      !Number.isInteger(value.correctCount) || value.correctCount < 0 || value.correctCount > 5 ||
      typeof value.roundId !== 'string' || k !== key(uid, value.roundId) ||
      !['match', 'pinyin', 'listen', 'word-order', 'sentence-order'].includes(value.mode)) {
      throw new Error('Invalid pending learning round. Browser progress has not been deleted.');
    }
    rounds.push(value);
  }
  return rounds;
}
