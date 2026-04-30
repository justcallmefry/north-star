/**
 * Deterministic prompt scheduler.
 *
 * Goals:
 *  - Same prompt for both partners on the same day.
 *  - Different couples get different sequences.
 *  - 21-day cooldown so fresh content stays fresh.
 *  - Depth balance: cap heavy prompts in any rolling 7-day window.
 *  - Category diversity: never the same category two days in a row.
 *  - Day-of-week texture: Saturday prefers playful, Sunday/Wednesday
 *    can carry a deep one.
 *  - Milestone prompts are never picked by the regular rotation —
 *    they're surfaced only via dedicated milestone hooks.
 *
 * The scheduler is deterministic given (relationshipId, dateString,
 * eligible prompts). Calling it again on the same day returns the
 * same prompt.
 */

export type SchedulerPrompt = {
  id: string;
  category: string | null;
  tone: string | null;
  /** 1–5; higher = heavier emotional / cognitive load. */
  depthLevel?: number;
  /** 1–5; higher = more playful / entertaining. */
  funScore?: number;
  /** When true, exclude from regular rotation. */
  isMilestone?: boolean;
  /** When true, only schedule on Saturday/Sunday. */
  weekendOnly?: boolean;
};

export type RecentSession = {
  /** ISO date string for stable comparisons. */
  sessionDate: string;
  promptId: string | null;
  category: string | null;
  tone: string | null;
  depthLevel?: number | null;
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
const DEPTH_WINDOW_DAYS = 7;
/** Max prompts with depthLevel >= 4 per rolling 7-day window. */
const MAX_HEAVY_IN_WINDOW = 1;
/** Max prompts with depthLevel >= 3 per rolling 7-day window. */
const MAX_DEEPISH_IN_WINDOW = 2;

/** 0 = Sunday, 6 = Saturday — derived from YYYY-MM-DD without TZ surprises. */
function dayOfWeekFromKey(todayKey: string): number {
  const [y, m, d] = todayKey.split("-").map((s) => Number(s));
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Return the prompt id to use for today, or null if none could be found. */
export function pickPrompt(input: SchedulerInput): string | null {
  const { relationshipId, todayKey, eligible: rawEligible, recent } = input;
  if (rawEligible.length === 0) return null;

  const dow = dayOfWeekFromKey(todayKey);
  const isWeekend = dow === 0 || dow === 6;
  const isSaturday = dow === 6;

  // Always exclude milestone prompts from regular rotation.
  // Exclude weekend-only prompts on weekdays.
  const eligible = rawEligible.filter((p) => {
    if (p.isMilestone) return false;
    if (p.weekendOnly && !isWeekend) return false;
    return true;
  });
  if (eligible.length === 0) return null;

  // 1. Cooldown: prompts used in last COOLDOWN_DAYS sessions are excluded.
  const cooldownIds = new Set(
    recent
      .slice(0, COOLDOWN_DAYS)
      .map((r) => r.promptId)
      .filter((id): id is string => !!id)
  );

  // 2. Avoid same category as yesterday's prompt.
  const lastCategory = recent[0]?.category ?? null;

  // 3. Depth balance over the rolling window.
  const window = recent.slice(0, DEPTH_WINDOW_DAYS);
  const heavyInWindow = window.filter((r) => (r.depthLevel ?? 0) >= 4).length;
  const deepishInWindow = window.filter((r) => (r.depthLevel ?? 0) >= 3).length;
  const blockHeavy = heavyInWindow >= MAX_HEAVY_IN_WINDOW;
  const blockDeepish = deepishInWindow >= MAX_DEEPISH_IN_WINDOW;

  // Saturday: strongly prefer playful — exclude depthLevel >= 3 if pool allows.
  const saturdayBlock = isSaturday;

  const passesDepth = (p: SchedulerPrompt): boolean => {
    const d = p.depthLevel ?? 2;
    if (saturdayBlock && d >= 3) return false;
    if (blockHeavy && d >= 4) return false;
    if (blockDeepish && d >= 3) return false;
    return true;
  };

  // Try strict → relaxed constraint sets in order.
  const constraintSets: Array<(p: SchedulerPrompt) => boolean> = [
    // Strictest: cooldown + category diversity + depth balance
    (p) => !cooldownIds.has(p.id) && p.category !== lastCategory && passesDepth(p),
    // Relax category
    (p) => !cooldownIds.has(p.id) && passesDepth(p),
    // Relax depth (still respect cooldown)
    (p) => !cooldownIds.has(p.id),
    // Last resort: ignore cooldown
    () => true,
  ];

  for (const filter of constraintSets) {
    const pool = eligible.filter(filter);
    if (pool.length === 0) continue;
    // On Saturday, weight playful prompts higher by including high-funScore
    // entries twice in the candidate pool. Deterministic — same couple sees
    // the same prompt.
    const weighted = isSaturday
      ? pool.flatMap((p) => ((p.funScore ?? 3) >= 4 ? [p, p] : [p]))
      : pool;
    const seed = hash(`${relationshipId}::${todayKey}`);
    const idx = seed % weighted.length;
    return weighted[idx].id;
  }

  return null;
}
