import type { LearningRoundInput } from '@workspace/api-client-react';

export const OUTBOX_PREFIX = 'mg-pending-round:';
export const OUTBOX_EVENT = 'mg-progress-outbox';
const key = (uid: string, roundId: string, questionId: string) => `${OUTBOX_PREFIX}${uid}:${roundId}:${questionId}`;

/** One key per round prevents different tabs from overwriting each other's queue. */
export function queueRound(uid: string, round: LearningRoundInput) {
  localStorage.setItem(key(uid, round.roundId, round.questionId), JSON.stringify(round));
  window.dispatchEvent(new Event(OUTBOX_EVENT));
}

export function acknowledgeRound(uid: string, roundId: string, questionId: string) {
  localStorage.removeItem(key(uid, roundId, questionId));
  window.dispatchEvent(new Event(OUTBOX_EVENT));
}

export function pendingRounds(uid: string): LearningRoundInput[] {
  const rounds: LearningRoundInput[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (!k?.startsWith(`${OUTBOX_PREFIX}${uid}:`)) continue;
    const value = JSON.parse(localStorage.getItem(k)!) as LearningRoundInput;
      if (!value || typeof value.roundId !== 'string' || typeof value.questionId !== 'string' ||
      typeof value.answer !== 'string' || k !== key(uid, value.roundId, value.questionId)) {
      throw new Error('Invalid pending learning round. Browser progress has not been deleted.');
    }
    rounds.push(value);
  }
  return rounds;
}
