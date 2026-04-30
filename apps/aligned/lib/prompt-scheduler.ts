/**
 * Deterministic prompt scheduler.
 *
 * Goals:
 *  - Same prompt for both partners on the same day (a couple sees ONE prompt).
 *  - Different couples get different sequences (no shared "today's prompt").
 *  - 21-day cooldown so fresh content stays fresh.
 *  - Tone balance: avoid 3+ deep prompts in any rolling 7-day window.
 *  - Category diversity: never the same category two days in a row.
 *  - Graceful fallback: relax constraints when the eligible pool is empty.
 *
 * The scheduler is deterministic given (relationshipId, dateString,
 * eligible prompts). It is therefore idempotent — calling it again on
 * the same day for the same couple returns the same prompt.
 */

export type SchedulerPrompt = {
  id: string;
  category: string | null;
  tone: string | null;
};

export type RecentSession = {
  /** ISO date string for stable comparisons. */
  sessionDate: string;
  promptId: string | null;
  category: string | null;
  tone: string | null;
};

export type SchedulerInput = {
  relationshipId: string;
  /** Today's date as YYYY-MM-DD. */
  todayKey: string;
  /** All eligible prompts (active, type=daily, intro filter applied). */
  eligible: SchedulerPrompt[];
  /** Most recent sessions, newest first. Up to ~21 entries. */
  recent: RecentSession[];
};

/** Fast deterministic 32-bit hash. (cyrb53-lite, sufficient for indexing.) */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const COOLDOWN_DAYS = 21;
const DEEP_TONE_WINDOW_DAYS = 7;
const MAX_DEEP_IN_WINDOW = 2;

/** Return the prompt id to use for today, or null if none could be found. */
export function pickPrompt(input: SchedulerInput): string | null {
  const { relationshipId, todayKey, eligible, recent } = input;
  if (eligible.length === 0) return null;

  // 1. Cooldown: prompts used in last COOLDOWN_DAYS sessions are excluded.
  const cooldownIds = new Set(
    recent.slice(0, COOLDOWN_DAYS).map((r) => r.promptId).filter((id): id is string => !!id)
  );

  // 2. Avoid same category as yesterday's prompt.
  const lastCategory = recent[0]?.category ?? null;

  // 3. Tone balance: count "deep" tones in the last 7 days.
  const deepInWindow = recent
    .slice(0, DEEP_TONE_WINDOW_DAYS)
    .filter((r) => r.tone === "deep").length;
  const blockDeep = deepInWindow >= MAX_DEEP_IN_WINDOW;

  // Try strict → relaxed constraint sets in order.
  const constraintSets: Array<(p: SchedulerPrompt) => boolean> = [
    // Strictest: cooldown + category diversity + tone balance
    (p) =>
      !cooldownIds.has(p.id) &&
      p.category !== lastCategory &&
      (!blockDeep || p.tone !== "deep"),
    // Relax category
    (p) => !cooldownIds.has(p.id) && (!blockDeep || p.tone !== "deep"),
    // Relax tone too
    (p) => !cooldownIds.has(p.id),
    // Last resort: ignore cooldown
    () => true,
  ];

  for (const filter of constraintSets) {
    const pool = eligible.filter(filter);
    if (pool.length === 0) continue;
    // Deterministic shuffle via index hash so each couple/day pair gets a
    // stable but different starting point in the pool.
    const seed = hash(`${relationshipId}::${todayKey}`);
    const idx = seed % pool.length;
    return pool[idx].id;
  }

  return null;
}
