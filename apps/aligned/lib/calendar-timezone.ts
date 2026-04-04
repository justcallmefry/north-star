/**
 * Shared calendar-day helpers (IANA time zones). Safe for server and client bundles.
 */

export function isValidIanaTimeZone(timeZone: string): boolean {
  const tz = timeZone?.trim();
  if (!tz || tz.length > 120) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/** Calendar YYYY-MM-DD for `date` interpreted in `timeZone`. */
export function formatYyyyMmDdInTimeZone(date: Date, timeZone: string): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!y || !m || !day) throw new Error("Could not format date in time zone");
  return `${y}-${m}-${day}`;
}

/** Milliseconds from `new Date()` until the next calendar day starts in `timeZone`. */
export function msUntilNextMidnightInTimeZone(timeZone: string): number {
  const now = Date.now();
  const today = formatYyyyMmDdInTimeZone(new Date(now), timeZone);
  let lo = now;
  let hi = now + 49 * 60 * 60 * 1000;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const ymd = formatYyyyMmDdInTimeZone(new Date(mid), timeZone);
    if (ymd > today) hi = mid;
    else lo = mid + 1;
  }
  return Math.max(0, lo - now);
}
