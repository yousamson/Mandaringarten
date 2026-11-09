/** Merge a legacy browser snapshot with distinct, already-recorded server rounds.
 * Neither retries nor a lower snapshot from another browser may reduce or duplicate XP.
 */
export function mergeLegacyProgress(current: number[], legacyTotal: number, earnedByStage: number[]) {
  return current.map((xp, index) => Math.max(
    xp,
    Math.min(100, Math.max(0, legacyTotal - index * 100)) + (earnedByStage[index] ?? 0),
  ));
}

export function deriveLegacyBaseline(current: number[], historicalXpByStage: number[]) {
  return current.map((xp, index) => Math.max(0, xp - (historicalXpByStage[index] ?? 0)));
}

export function calculateXpBalances(
  legacyBaselineByStage: number[],
  answerXpByStage: number[],
  spentByStage: number[],
) {
  return legacyBaselineByStage.map((baseline, index) => Math.max(
    0,
    baseline + (answerXpByStage[index] ?? 0) - (spentByStage[index] ?? 0),
  ));
}
