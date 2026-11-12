export type ClerkDashboardUser = {
  id: string;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
    verification?: { status?: string | null } | null;
  }>;
  primaryEmailAddressId: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: number;
};

export function hongKongDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function shiftCalendarDate(day: string, offsetDays: number): string {
  const value = new Date(`${day}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + offsetDays);
  return value.toISOString().slice(0, 10);
}

export function fillDailyPageViews(
  rows: Array<{ date: string; pageViews: number }>,
  today: string,
  firstAllowedDay: string,
): Array<{ date: string; pageViews: number }> {
  if (rows.length === 0) return [];
  const counts = new Map(rows.map((row) => [row.date, row.pageViews]));
  const firstSavedDay = rows.reduce(
    (first, row) => row.date < first ? row.date : first,
    rows[0].date,
  );
  const start = firstSavedDay < firstAllowedDay ? firstAllowedDay : firstSavedDay;
  const result: Array<{ date: string; pageViews: number }> = [];
  for (let date = start; date <= today; date = shiftCalendarDate(date, 1)) {
    result.push({ date, pageViews: counts.get(date) ?? 0 });
  }
  return result;
}

/** Return only the fields the administrator needs; omit Clerk metadata and provider data. */
export function projectAdminMember(user: ClerkDashboardUser, isAdmin = false) {
  const email = user.emailAddresses.find(
    (candidate) => candidate.id === user.primaryEmailAddressId,
  )?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || null;
  return {
    id: user.id,
    email: isAdmin ? null : email,
    name: isAdmin ? "Mandarin Garden team" : name,
    createdAt: new Date(user.createdAt).toISOString(),
  };
}
