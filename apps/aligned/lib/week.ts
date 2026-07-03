/**
 * ISO week helpers shared by dares, quests, and the constellation's
 * golden-week detection. Pure — no DB, no auth.
 */

/** ISO week key, e.g. "2026-W27". Weeks run Monday–Sunday. */
export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * Reveals needed in one ISO week for the weekly co-op quest / golden week.
 * Lives here (not lib/quests.ts) because "use server" modules can only
 * export async functions.
 */
export const WEEKLY_REVEAL_TARGET = 5;

/** UTC Monday 00:00 of the ISO week containing `date`. */
export function isoWeekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d;
}
