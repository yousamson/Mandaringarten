export const XP_PER_CORRECT = 1;
export const XP_PER_INCORRECT = 1;
export const XP_COMPLETE = 100;
export const GARDEN_CARE_XP_COST = 20;
export const GARDEN_FULL_GROWTH_DAYS = 30;
export const GARDEN_BLOOM_DAYS = 10;

export type GardenCareType = 'water' | 'fertilize';

export type GardenProgress = {
  growthDays: number;
  streakDays: number;
  lastCareDate: string | null;
  lastCareType: GardenCareType | null;
};

export type GardenStatus = GardenProgress & {
  daysSinceCare: number | null;
  caredToday: boolean;
  careAvailable: boolean;
  xpNeeded: number;
};

export function utcDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function dayNumber(day: string): number {
  const [year, month, date] = day.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, date) / 86_400_000);
}

export function daysBetweenUtcDays(older: string, newer: string): number {
  return Math.max(0, dayNumber(newer) - dayNumber(older));
}

export function getGardenStatus(
  saved: GardenProgress,
  today = utcDayKey(),
  selectedStageXp = 0,
): GardenStatus {
  const daysSinceCare = saved.lastCareDate
    ? daysBetweenUtcDays(saved.lastCareDate, today)
    : null;
  const caredToday = daysSinceCare === 0;
  const growthDays = daysSinceCare === null || daysSinceCare >= GARDEN_FULL_GROWTH_DAYS
    ? 0
    : Math.max(0, saved.growthDays - Math.max(0, daysSinceCare - 4));
  const streakDays = daysSinceCare !== null && daysSinceCare <= 1
    ? saved.streakDays
    : 0;
  const xpNeeded = Math.max(0, GARDEN_CARE_XP_COST - Math.max(0, selectedStageXp));

  return {
    growthDays,
    streakDays,
    daysSinceCare,
    caredToday,
    careAvailable: !caredToday && xpNeeded === 0,
    xpNeeded,
    lastCareDate: saved.lastCareDate,
    lastCareType: saved.lastCareType,
  };
}

export function advanceGardenCare(
  saved: GardenProgress,
  type: GardenCareType,
  today = utcDayKey(),
): GardenProgress {
  const status = getGardenStatus(saved, today);
  if (status.caredToday) {
    throw new Error('The garden has already been cared for today.');
  }

  return {
    growthDays: status.daysSinceCare === null
      ? 1
      : status.daysSinceCare === 1
        ? Math.min(GARDEN_FULL_GROWTH_DAYS, status.growthDays + 1)
        : Math.max(1, status.growthDays),
    streakDays: status.daysSinceCare === 1 ? Math.min(GARDEN_FULL_GROWTH_DAYS, status.streakDays + 1) : 1,
    lastCareDate: today,
    lastCareType: type,
  };
}
