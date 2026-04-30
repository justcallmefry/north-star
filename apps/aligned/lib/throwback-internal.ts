// apps/aligned/lib/throwback-internal.ts
// Pure helpers used by lib/throwback.ts. Kept in a separate, non-"use server"
// module so the smoke script can import them and so Next's bundler doesn't
// reject non-function exports from a server-action file.

const SATURDAY = 6;
/** Of the eligible Saturdays, this fraction shows the throwback variant. */
export const THROWBACK_SHARE = 0.5;
export const MIN_AGE_DAYS = 30;

/**
 * Hash a string deterministically (cyrb53-lite). Used to pick the throwback
 * variant on a stable share of Saturdays per couple.
 */
export function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h * 31) + str.charCodeAt(i)) >>> 0;
  return h;
}

export function isThrowbackDay(relationshipId: string, dateStr: string): boolean {
  const buckets = 100;
  const cutoff = Math.floor(buckets * THROWBACK_SHARE);
  return hash(relationshipId + dateStr) % buckets < cutoff;
}

export function isSaturday(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00.000Z");
  return d.getUTCDay() === SATURDAY;
}

export function monthsBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24 * 30)));
}
