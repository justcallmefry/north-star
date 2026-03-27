/** Snapshot of a session row used to avoid repeating the same content bundle for a relationship. */

export type ContentSessionSnapshot = {
  sessionDate: Date;
  contentDayIndex: number | null;
};

/**
 * Which 1-based index into quiz-days.json / agreement-days.json this session uses.
 * Legacy rows use `fallbackFromDate(sessionDate)` when `contentDayIndex` is null.
 */
export function resolveContentDayIndex(
  sessionDate: Date,
  stored: number | null | undefined,
  maxDay: number,
  fallbackFromDate: (d: Date) => number
): number {
  const clamp = (n: number) => {
    if (!Number.isFinite(n) || maxDay < 1) return 1;
    const m = ((Math.floor(n) - 1) % maxDay) + 1;
    return m >= 1 ? m : 1;
  };
  if (
    stored != null &&
    Number.isInteger(stored) &&
    stored >= 1 &&
    stored <= maxDay
  ) {
    return stored;
  }
  return clamp(fallbackFromDate(sessionDate));
}

/**
 * Picks the next content bundle for a new session: prefer any day 1..maxDay not yet used
 * by this relationship; if all are used, pick the bundle whose last use was longest ago (LRU).
 */
export function pickNextContentDayIndex(params: {
  maxDay: number;
  sessions: ContentSessionSnapshot[];
  fallbackFromDate: (d: Date) => number;
}): number {
  const { maxDay, sessions, fallbackFromDate } = params;
  if (maxDay < 1) return 1;

  const lastUse = new Map<number, Date>();
  for (const s of sessions) {
    const idx = resolveContentDayIndex(
      s.sessionDate,
      s.contentDayIndex,
      maxDay,
      fallbackFromDate
    );
    const d = s.sessionDate;
    const prev = lastUse.get(idx);
    if (!prev || d > prev) lastUse.set(idx, d);
  }

  for (let day = 1; day <= maxDay; day++) {
    if (!lastUse.has(day)) return day;
  }

  let bestDay = 1;
  let bestT = lastUse.get(1)!;
  for (let day = 2; day <= maxDay; day++) {
    const t = lastUse.get(day)!;
    if (t < bestT) {
      bestT = t;
      bestDay = day;
    }
  }
  return bestDay;
}
