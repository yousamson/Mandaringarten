export const examLevelIds = {
  hsk: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  // PSC grade 1A is the highest band; progression starts at the lowest, 3B.
  psc: ["3b", "3a", "2b", "2a", "1b", "1a"],
} as const;

export const examActivities = ["meaning", "listening", "pinyin", "article"] as const;
export type ExamTrackId = keyof typeof examLevelIds;
export type ExamActivity = typeof examActivities[number];
export type ExamMembershipTier = "none" | "trial" | "subscribed" | "admin";

export type ExamProgressRecord = {
  trackId: string;
  levelId: string;
  completedActivities: string[];
};

const requiredActivityCount = examActivities.length;

export function isExamTrack(value: string): value is ExamTrackId {
  return Object.hasOwn(examLevelIds, value);
}

export function isExamLevel(trackId: string, levelId: string): boolean {
  return isExamTrack(trackId) && examLevelIds[trackId].includes(levelId as never);
}

export function isExamActivity(value: string): value is ExamActivity {
  return (examActivities as readonly string[]).includes(value);
}

export function isExamLevelComplete(
  records: ExamProgressRecord[],
  trackId: ExamTrackId,
  levelId: string,
): boolean {
  const record = records.find((item) => item.trackId === trackId && item.levelId === levelId);
  return examActivities.every((activity) => record?.completedActivities.includes(activity));
}

export function canAccessExamLevel(
  tier: ExamMembershipTier,
  records: ExamProgressRecord[],
  trackId: ExamTrackId,
  levelId: string,
): boolean {
  const index = examLevelIds[trackId].indexOf(levelId as never);
  if (index < 0 || tier === "none") return false;
  if (tier === "admin") return true;
  if (tier === "trial") return index === 0;
  return index === 0 || examLevelIds[trackId]
    .slice(0, index)
    .every((previousLevelId) => isExamLevelComplete(records, trackId, previousLevelId));
}

export function buildExamProgress(
  membershipTier: ExamMembershipTier,
  records: ExamProgressRecord[],
) {
  return {
    membershipTier,
    tracks: (Object.keys(examLevelIds) as ExamTrackId[]).map((trackId) => ({
      trackId,
      levels: examLevelIds[trackId].map((levelId) => {
        const record = records.find((item) => item.trackId === trackId && item.levelId === levelId);
        const completedActivities = examActivities.filter((activity) => record?.completedActivities.includes(activity));
        const isComplete = completedActivities.length === requiredActivityCount;
        const available = canAccessExamLevel(membershipTier, records, trackId, levelId);
        return {
          levelId,
          status: available ? (isComplete ? "completed" : "available") : "locked",
          completedActivities,
          completedCount: completedActivities.length,
          requiredCount: requiredActivityCount,
        };
      }),
    })),
  };
}
