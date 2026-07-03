/**
 * Pure streak math — no DB, no auth. Kept separate from lib/streak.ts
 * ("use server") so it can be unit-tested and reasoned about directly.
 *
 * Grace Days: earned every 7th consecutive day (cap GRACE_CAP), one is
 * auto-consumed to bridge a single missed day. Gaps of 2+ missed days
 * still reset. Never purchasable.
 */

export const GRACE_CAP = 2;
export const GRACE_EARN_EVERY = 7;

/** Format a Date as YYYY-MM-DD (UTC date only). */
export function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** The day before a YYYY-MM-DD date string. */
export function dayBefore(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00.000Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return toDateString(d);
}

/** Whole days from `fromStr` to `toStr` (positive when toStr is later). */
export function daysBetween(fromStr: string, toStr: string): number {
  const from = new Date(fromStr + "T00:00:00.000Z");
  const to = new Date(toStr + "T00:00:00.000Z");
  return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

export type StreakRow = {
  currentCount: number;
  longestCount: number;
  /** YYYY-MM-DD or null */
  lastCompletedDate: string | null;
  graceDays: number;
  /** YYYY-MM-DD or null — the missed day the last Grace Day bridged */
  graceUsedDate: string | null;
};

export type StreakUpdate = StreakRow & {
  /** False when this reveal is a same-day duplicate — nothing to persist. */
  changed: boolean;
  /** A Grace Day was consumed to bridge yesterday's miss. */
  graceJustUsed: boolean;
  /** A Grace Day was banked on this update (respects the cap). */
  graceJustEarned: boolean;
};

/**
 * Compute the next streak row after a reveal on `completedStr` (YYYY-MM-DD).
 */
export function computeStreakUpdate(
  existing: StreakRow | null,
  completedStr: string
): StreakUpdate {
  const yesterdayStr = dayBefore(completedStr);

  let currentCount: number;
  let graceDays = existing?.graceDays ?? 0;
  let graceUsedDate = existing?.graceUsedDate ?? null;
  let graceJustUsed = false;

  if (!existing || !existing.lastCompletedDate) {
    currentCount = 1;
  } else if (existing.lastCompletedDate === completedStr) {
    // Same day (e.g. double reveal) — no change
    return {
      ...existing,
      changed: false,
      graceJustUsed: false,
      graceJustEarned: false,
    };
  } else if (existing.lastCompletedDate === yesterdayStr) {
    currentCount = existing.currentCount + 1;
  } else if (
    existing.lastCompletedDate === dayBefore(yesterdayStr) &&
    graceDays > 0 &&
    existing.currentCount > 0
  ) {
    // Missed exactly one day with grace banked — bridge it. The missed
    // day is not counted; the streak simply survives and today adds one.
    currentCount = existing.currentCount + 1;
    graceDays -= 1;
    graceUsedDate = yesterdayStr;
    graceJustUsed = true;
  } else {
    currentCount = 1;
  }

  const longestCount = Math.max(existing?.longestCount ?? 0, currentCount);

  // Earn on every 7th consecutive day, up to the cap.
  let graceJustEarned = false;
  if (currentCount > 0 && currentCount % GRACE_EARN_EVERY === 0 && graceDays < GRACE_CAP) {
    graceDays += 1;
    graceJustEarned = true;
  }

  return {
    currentCount,
    longestCount,
    lastCompletedDate: completedStr,
    graceDays,
    graceUsedDate,
    changed: true,
    graceJustUsed,
    graceJustEarned,
  };
}

export type StreakView = {
  currentCount: number;
  longestCount: number;
  /** True on the first day a previous streak is no longer current (for gentle reset copy). */
  justReset?: boolean;
  /** Banked Grace Days. */
  graceDays: number;
  /** Missed yesterday, but a Grace Day is holding the streak — answer today to keep it. */
  graceArmed?: boolean;
  /** Today's reveal was bridged by a Grace Day (show the "held" line). */
  graceJustUsed?: boolean;
  /** Today's reveal banked a Grace Day (7th consecutive day). */
  graceJustEarned?: boolean;
};

/**
 * How the streak should read on `todayStr`, without mutating anything.
 */
export function computeStreakView(row: StreakRow, todayStr: string): StreakView {
  const lastStr = row.lastCompletedDate;

  let isStillCurrent = false;
  let justReset = false;
  let graceArmed = false;

  if (lastStr) {
    const daysDiff = daysBetween(lastStr, todayStr);
    // Current for today and the day after last completion (as before)…
    isStillCurrent = daysDiff === 0 || daysDiff === 1;
    // …and, new: a banked Grace Day holds the streak through one missed day.
    if (daysDiff === 2 && row.graceDays > 0 && row.currentCount > 0) {
      isStillCurrent = true;
      graceArmed = true;
    }
    justReset = daysDiff === 2 && !graceArmed && row.currentCount > 0;
  }

  const completedToday = lastStr != null && lastStr === todayStr;

  return {
    currentCount: isStillCurrent ? row.currentCount : 0,
    longestCount: row.longestCount,
    justReset,
    graceDays: row.graceDays,
    graceArmed,
    graceJustUsed:
      completedToday &&
      row.graceUsedDate != null &&
      row.graceUsedDate === dayBefore(todayStr),
    graceJustEarned:
      completedToday &&
      row.currentCount > 0 &&
      row.currentCount % GRACE_EARN_EVERY === 0 &&
      row.graceDays > 0,
  };
}
