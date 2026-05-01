/**
 * Week window for a Weekly Issue: Monday 00:00 (inclusive) → next Monday 00:00 (exclusive).
 *
 * `now` is treated as a moment in the user's local timezone. The caller is
 * responsible for passing a Date that has already been shifted into the user's
 * locale; this function does not handle timezones, only date math.
 *
 * For a Sunday-publish flow the caller passes the current Sunday-morning Date
 * and we walk back to the prior Monday.
 */
export function weekWindowFor(now: Date): { start: Date; end: Date; weekKey: string } {
  // Anchor at midnight on `now`'s calendar day
  const anchor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 0 = Sun, 1 = Mon, ... 6 = Sat
  const dow = anchor.getDay();
  // Days back to the most recent Monday (Sunday goes back 6 days)
  const daysBackToMonday = dow === 0 ? 6 : dow - 1;

  const start = new Date(anchor);
  start.setDate(anchor.getDate() - daysBackToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  // ISO-week-style key: YYYY-Www
  const weekKey = isoWeekKey(start);

  return { start, end, weekKey };
}

function isoWeekKey(d: Date): string {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Sun=0 -> 7)
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
