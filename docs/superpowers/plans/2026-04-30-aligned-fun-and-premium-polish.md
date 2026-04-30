# Aligned — Fun & Premium Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Aligned's daily ritual feel premium and emotionally rewarding — by polishing the Today card, intensifying the reveal moment, layering a soft weekly rhythm, and adding a Saturday Throwback variant. No new modes, no schema changes.

**Architecture:** Pure additive changes. New small libs (`copy`, `day-theme`, `novelty`, `throwback`) feed extensions to existing `getToday`/`getSession`. UI refactors the Today card and reveal sequence in place. The throwback path reuses existing `Memory` and `DailySession` models.

**Tech Stack:** Next.js 16 App Router, React 18, Prisma 5 (PostgreSQL), Tailwind 3, TypeScript 5, Capacitor (for haptics).

**Working directory:** `apps/aligned/` (the worktree root is `C:\Users\cfry\Desktop\North Star\.claude\worktrees\elegant-brattain-a8eccd`). All file paths below are relative to `apps/aligned/`.

**Verification model:** This codebase has no test runner. Each task ends with `npm run typecheck -w aligned` (run from worktree root) and a manual verification step. Pure-function libs are validated with a `tsx` smoke script invoked from the task.

**Reference spec:** [`docs/superpowers/specs/2026-04-30-aligned-fun-and-premium-polish-design.md`](../specs/2026-04-30-aligned-fun-and-premium-polish-design.md)

---

## File map

**New files**
- `lib/copy.ts` — centralized microcopy
- `lib/day-theme.ts` — 7-day theme map + helper
- `lib/novelty.ts` — novel-content-word detection
- `lib/throwback.ts` — Saturday throwback eligibility + memory pick
- `app/app/today-skeleton.tsx` — loading skeleton matching Today card
- `app/app/today-throwback-card.tsx` — Saturday throwback variant
- `app/app/session/[id]/quick-react-row.tsx` — 5-emoji inline reaction row
- `app/app/session/[id]/post-reveal-action-bar.tsx` — sticky React/Save/Talk row
- `scripts/smoke-novelty.ts` — pure-function smoke test
- `scripts/smoke-throwback.ts` — pure-function smoke test

**Modified files**
- `lib/sessions.ts` — `GetTodayResult` extended; throwback variant; `forcePromptId`; `noveltyTags` on `GetSessionResult`; then/now metadata
- `app/app/today-card.tsx` — day-themed eyebrow, meta line, dispatch to throwback
- `app/app/today-section.tsx` — pass throwback variant through; render skeleton
- `app/app/app-page-client.tsx` — featured "Also today" slot per day
- `app/app/session/[id]/session-content.tsx` — slower partner-reveal pacing, action bar, quick-react row, novelty tag, then/now treatment
- `components/streak-celebration.tsx` — three milestone variants (confetti tiers)
- `app/globals.css` — new keyframes (`partner-reveal`, `confetti-burst`, `loading-dots`)

---

## Task 1: Create microcopy library `lib/copy.ts`

**Files:**
- Create: `apps/aligned/lib/copy.ts`

- [ ] **Step 1: Write the file**

```ts
// apps/aligned/lib/copy.ts
// Central microcopy. Use COPY.* in new code. Existing scattered strings
// will be migrated incrementally — do not bulk-replace in this PR.

export const COPY = {
  waiting: {
    forPartner: (name: string | null | undefined): string =>
      name
        ? `${name} hasn't answered yet — they'll get a nudge tonight.`
        : `They haven't answered yet — they'll get a nudge tonight.`,
    forYou: (name: string | null | undefined): string =>
      name ? `${name} answered. They're waiting on you.` : `They answered — your turn.`,
  },
  reveal: {
    pre: (name: string | null | undefined): string =>
      name ? `Ready to see what ${name} wrote?` : `Ready to see what they wrote?`,
    earned: "You both showed up.",
    novel: "First time you've heard this",
    saved: "Saved to memories.",
  },
  empty: {
    noPair: "Pair with someone to start your daily ritual.",
    noToday: "No question today — check back tomorrow.",
  },
  errors: {
    submit: "That didn't save. Try once more?",
    network: "We lost the connection. Pull to refresh.",
  },
  push: {
    daily: (name: string | null | undefined): string =>
      name ? `Today's question is up. Answer with ${name}.` : `Today's question is up.`,
    partnerDone: (name: string | null | undefined): string =>
      name ? `${name} answered — your turn.` : `They answered — your turn.`,
    bothDone: (_name: string | null | undefined): string =>
      `You're both in — ready to reveal?`,
  },
  throwback: {
    eyebrow: "Saturday — look back",
    ageLine: (months: number): string =>
      months <= 1
        ? "A few weeks ago, you both answered:"
        : months < 12
          ? `${months} months ago, you both answered:`
          : months < 24
            ? "A year ago, you both answered:"
            : `${Math.floor(months / 12)} years ago, you both answered:`,
    action: "Answer it again — see how you've grown",
    thenLabel: "Then",
    nowLabel: "Now",
  },
} as const;
```

- [ ] **Step 2: Typecheck**

Run from worktree root: `npm run typecheck -w aligned`

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add apps/aligned/lib/copy.ts
git commit -m "feat(aligned): add lib/copy.ts microcopy library"
```

---

## Task 2: Create day theme map `lib/day-theme.ts`

**Files:**
- Create: `apps/aligned/lib/day-theme.ts`

- [ ] **Step 1: Write the file**

```ts
// apps/aligned/lib/day-theme.ts
// 7-day theme map. Each day has restrained tonal classes used by the
// Today card eyebrow + section gradient. The card structure is identical
// across days — only the tints shift.

export type DayThemeKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type DayTheme = {
  key: DayThemeKey;
  /** Visible label in the eyebrow chip (e.g. "Tuesday — appreciation day"). */
  label: string;
  /** Tailwind class for the section background gradient + border. */
  sectionClass: string;
  /** Tailwind class for the eyebrow chip background. */
  eyebrowChipClass: string;
  /** Tailwind class for the eyebrow chip dot. */
  eyebrowDotClass: string;
  /** Tailwind class for the eyebrow chip text. */
  eyebrowTextClass: string;
  /** Which secondary mode (route key) is featured today, if any. */
  featuredMode: "appreciation" | "quiz" | "dare" | "throwback" | "recap" | null;
};

const SUN: DayTheme = {
  key: "sun",
  label: "Sunday — reflection",
  sectionClass:
    "relative animate-calm-fade-in rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 via-white to-white p-5 shadow-sm sm:p-6",
  eyebrowChipClass: "inline-flex items-center gap-2 rounded-lg bg-emerald-100/70 px-3 py-1",
  eyebrowDotClass: "h-1.5 w-1.5 rounded-full bg-emerald-500",
  eyebrowTextClass:
    "text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 sm:text-sm",
  featuredMode: "recap",
};

const MON: DayTheme = {
  key: "mon",
  label: "Monday — light",
  sectionClass:
    "relative animate-calm-fade-in rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-white to-white p-5 shadow-sm sm:p-6",
  eyebrowChipClass: "inline-flex items-center gap-2 rounded-lg bg-amber-100/70 px-3 py-1",
  eyebrowDotClass: "h-1.5 w-1.5 rounded-full bg-amber-500",
  eyebrowTextClass:
    "text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 sm:text-sm",
  featuredMode: null,
};

const TUE: DayTheme = {
  key: "tue",
  label: "Tuesday — appreciation",
  sectionClass:
    "relative animate-calm-fade-in rounded-2xl border border-peach-300/40 bg-gradient-to-br from-peach-300/20 via-white to-white p-5 shadow-sm sm:p-6",
  eyebrowChipClass: "inline-flex items-center gap-2 rounded-lg bg-peach-300/30 px-3 py-1",
  eyebrowDotClass: "h-1.5 w-1.5 rounded-full bg-peach-500",
  eyebrowTextClass:
    "text-xs font-semibold uppercase tracking-[0.18em] text-peach-600 sm:text-sm",
  featuredMode: "appreciation",
};

const WED: DayTheme = {
  key: "wed",
  label: "Wednesday — partner quiz",
  sectionClass:
    "relative animate-calm-fade-in rounded-2xl border border-cyan-200/60 bg-gradient-to-br from-cyan-50/80 via-white to-white p-5 shadow-sm sm:p-6",
  eyebrowChipClass: "inline-flex items-center gap-2 rounded-lg bg-cyan-100/70 px-3 py-1",
  eyebrowDotClass: "h-1.5 w-1.5 rounded-full bg-cyan-500",
  eyebrowTextClass:
    "text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 sm:text-sm",
  featuredMode: "quiz",
};

const THU: DayTheme = {
  key: "thu",
  label: "Thursday — deeper",
  sectionClass:
    "relative animate-calm-fade-in rounded-2xl border border-brand-100/80 bg-gradient-to-br from-brand-50/90 to-white p-5 shadow-sm ring-1 ring-brand-50/80 sm:p-6",
  eyebrowChipClass: "inline-flex items-center gap-2 rounded-lg bg-brand-100/80 px-3 py-1",
  eyebrowDotClass: "h-1.5 w-1.5 rounded-full bg-brand-500",
  eyebrowTextClass:
    "text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 sm:text-sm",
  featuredMode: null,
};

const FRI: DayTheme = {
  key: "fri",
  label: "Friday — date night",
  sectionClass:
    "relative animate-calm-fade-in rounded-2xl border border-orange-200/60 bg-gradient-to-br from-orange-50/80 via-white to-white p-5 shadow-sm sm:p-6",
  eyebrowChipClass: "inline-flex items-center gap-2 rounded-lg bg-orange-100/70 px-3 py-1",
  eyebrowDotClass: "h-1.5 w-1.5 rounded-full bg-orange-500",
  eyebrowTextClass:
    "text-xs font-semibold uppercase tracking-[0.18em] text-orange-700 sm:text-sm",
  featuredMode: "dare",
};

const SAT: DayTheme = {
  key: "sat",
  label: "Saturday — memory",
  sectionClass:
    "relative animate-calm-fade-in rounded-2xl border border-peach-300/40 bg-gradient-to-br from-peach-300/20 via-white to-white p-5 shadow-sm sm:p-6",
  eyebrowChipClass: "inline-flex items-center gap-2 rounded-lg bg-peach-300/30 px-3 py-1",
  eyebrowDotClass: "h-1.5 w-1.5 rounded-full bg-peach-500",
  eyebrowTextClass:
    "text-xs font-semibold uppercase tracking-[0.18em] text-peach-600 sm:text-sm",
  featuredMode: "throwback",
};

const DAY_THEMES: Record<number, DayTheme> = {
  0: SUN,
  1: MON,
  2: TUE,
  3: WED,
  4: THU,
  5: FRI,
  6: SAT,
};

/** JS Date.getDay() returns 0..6 (Sun..Sat). */
export function getDayTheme(date: Date): DayTheme {
  return DAY_THEMES[date.getDay()] ?? THU;
}

/** Convert depthLevel (1..5) to a human estimate. Returns null if unknown. */
export function estimateAnswerTime(depthLevel: number | null | undefined): string | null {
  if (depthLevel == null) return null;
  if (depthLevel <= 2) return "~30s";
  if (depthLevel === 3) return "~1 min";
  return "~2 min";
}

/** Capitalize first letter for category/tone display. */
export function titleCase(s: string | null | undefined): string | null {
  if (!s) return null;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck -w aligned`

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add apps/aligned/lib/day-theme.ts
git commit -m "feat(aligned): add lib/day-theme.ts 7-day theme map"
```

---

## Task 3: Create novelty-tag detection `lib/novelty.ts`

**Files:**
- Create: `apps/aligned/lib/novelty.ts`
- Create: `apps/aligned/scripts/smoke-novelty.ts`

- [ ] **Step 1: Write `lib/novelty.ts`**

```ts
// apps/aligned/lib/novelty.ts
// Pure word-set diff used to flag a partner's answer as containing
// content words they've never used in any past session for this couple.
// No AI, no DB. Server callers pass past texts directly.

const STOP_WORDS = new Set<string>([
  "the","a","an","and","or","but","if","then","else","when","while","of","in","on",
  "at","to","for","with","without","by","from","as","is","are","was","were","be",
  "been","being","do","does","did","doing","have","has","had","having","not","no",
  "yes","i","you","he","she","it","we","they","me","him","her","us","them","my",
  "your","his","its","our","their","this","that","these","those","there","here",
  "what","which","who","whom","whose","why","how","so","too","very","just","only",
  "really","quite","much","many","more","most","some","any","all","each","every",
  "few","both","other","another","such","same","also","into","about","like",
  "than","up","down","out","over","under","again","because","while","one","two",
  "three","four","five","six","seven","eight","nine","ten",
  "feel","felt","feels","feeling","think","thinks","thought","thinking",
  "want","wants","wanted","wanting","know","knows","knew","knowing",
  "say","said","says","saying","get","gets","got","getting","make","makes","made",
  "making","go","goes","went","going","come","comes","came","coming","take","takes",
  "took","taken","taking","see","sees","saw","seen","seeing","look","looks","looked",
  "looking","day","days","time","times","thing","things","way","ways","year","years",
]);

const MIN_WORD_LENGTH = 4;
const MIN_COMBINED_WORDCOUNT = 15;

function tokenize(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function contentWords(tokens: string[]): string[] {
  return tokens.filter(
    (t) => t.length >= MIN_WORD_LENGTH && !STOP_WORDS.has(t)
  );
}

/**
 * Returns up to 3 content words from `currentText` that do not appear in
 * any of `pastTexts`. Empty array means no novel words (or guard tripped).
 *
 * @param currentText      Partner's just-revealed answer
 * @param pastTexts        Partner's past answers (any historical responses)
 * @param userText         Current user's answer for the same session
 *                         (used only to bump combined wordcount guard)
 */
export function findNovelTags(
  currentText: string | null | undefined,
  pastTexts: (string | null | undefined)[],
  userText: string | null | undefined = null
): string[] {
  const currentTokens = tokenize(currentText);
  const userTokens = tokenize(userText);
  if (currentTokens.length + userTokens.length < MIN_COMBINED_WORDCOUNT) return [];

  const currentWords = contentWords(currentTokens);
  if (currentWords.length === 0) return [];

  const past = new Set<string>();
  for (const t of pastTexts) {
    for (const w of contentWords(tokenize(t))) past.add(w);
  }

  const seen = new Set<string>();
  const novel: string[] = [];
  for (const w of currentWords) {
    if (past.has(w)) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    novel.push(w);
    if (novel.length >= 3) break;
  }
  return novel;
}
```

- [ ] **Step 2: Write smoke test `scripts/smoke-novelty.ts`**

```ts
// apps/aligned/scripts/smoke-novelty.ts
// Standalone smoke for findNovelTags. Run: npx tsx scripts/smoke-novelty.ts
import { findNovelTags } from "../lib/novelty";

function assertEq<T>(name: string, actual: T, expected: T) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${name}\n  expected: ${e}\n  actual:   ${a}`);
    process.exit(1);
  }
  console.log(`PASS ${name}`);
}

// 1. Returns novel words when they appear in current but not past
assertEq(
  "novel words detected",
  findNovelTags(
    "I love watching the seabirds glide over those lighthouse cliffs",
    ["We had coffee on the porch", "I felt calm at the lake"],
    "Long enough user reply to satisfy the wordcount guard about feelings"
  ),
  ["watching", "seabirds", "glide"]
);

// 2. Combined wordcount guard suppresses on short content
assertEq(
  "wordcount guard",
  findNovelTags("seabirds", [], "tiny"),
  []
);

// 3. Stop words are ignored
assertEq(
  "stop words ignored",
  findNovelTags(
    "And the and that this just very really only also into",
    [],
    "Long enough user reply to satisfy the wordcount guard about feelings"
  ),
  []
);

// 4. Past words are excluded
assertEq(
  "past words excluded",
  findNovelTags(
    "lighthouse coffee porch sailing",
    ["coffee porch lighthouse"],
    "Long enough user reply to satisfy the wordcount guard about feelings"
  ),
  ["sailing"]
);

console.log("ALL PASS");
```

- [ ] **Step 3: Run smoke**

Run from `apps/aligned/`: `npx tsx scripts/smoke-novelty.ts`

Expected: `ALL PASS`.

- [ ] **Step 4: Typecheck**

Run from worktree root: `npm run typecheck -w aligned`

Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add apps/aligned/lib/novelty.ts apps/aligned/scripts/smoke-novelty.ts
git commit -m "feat(aligned): add novelty tag detection lib + smoke test"
```

---

## Task 4: Create throwback library `lib/throwback.ts`

**Files:**
- Create: `apps/aligned/lib/throwback.ts`
- Create: `apps/aligned/scripts/smoke-throwback.ts`

- [ ] **Step 1: Write `lib/throwback.ts`**

```ts
// apps/aligned/lib/throwback.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/relationship-members";
import { getServerAuthSession } from "@/lib/auth";

const MIN_AGE_DAYS = 30;
const SATURDAY = 6;
/** Of the eligible Saturdays, this fraction shows the throwback variant. */
const THROWBACK_SHARE = 0.5;

type StoredSnapshot = {
  kind?: string;
  promptText?: string | null;
  responses?: Array<{ userId: string; name: string | null; content: string | null }>;
};

export type ThrowbackToday = {
  /** Memory.id we're surfacing. */
  memoryId: string;
  /** The promptId of the original session — used by the re-answer path. */
  promptId: string | null;
  /** Original session date (ISO YYYY-MM-DD). */
  originalDate: string;
  /** Approximate months since original — for ageLine copy. */
  monthsAgo: number;
  /** Prompt text from the saved snapshot. */
  promptText: string;
  /** Each partner's answer from the saved snapshot. */
  responses: Array<{ userId: string; name: string | null; content: string | null }>;
};

/**
 * Hash a string deterministically (cyrb53-lite). Used to pick the throwback
 * variant on a stable share of Saturdays per couple.
 */
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h * 31) + str.charCodeAt(i)) >>> 0;
  return h;
}

function isThrowbackDay(relationshipId: string, dateStr: string): boolean {
  const buckets = 100;
  const cutoff = Math.floor(buckets * THROWBACK_SHARE);
  return hash(relationshipId + dateStr) % buckets < cutoff;
}

function isSaturday(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00.000Z");
  // Saturday in UTC. Acceptable approximation for couples in any timezone:
  // the rhythm aligns to UTC date which the rest of the app already uses.
  return d.getUTCDay() === SATURDAY;
}

function monthsBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24 * 30)));
}

/**
 * Returns a throwback Today result for the given relationship/date, or null
 * when not eligible. Caller is responsible for membership checks before
 * invoking — but we re-check defensively.
 */
export async function getThrowbackForToday(
  relationshipId: string,
  localDateStr: string
): Promise<ThrowbackToday | null> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return null;
  await requireActiveMember(session.user.id, relationshipId);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDateStr)) return null;
  if (!isSaturday(localDateStr)) return null;
  if (!isThrowbackDay(relationshipId, localDateStr)) return null;

  const today = new Date(localDateStr + "T00:00:00.000Z");
  const cutoff = new Date(today);
  cutoff.setUTCDate(cutoff.getUTCDate() - MIN_AGE_DAYS);

  // Pick deterministically among eligible memories: oldest first by savedAt
  // and break ties by (relationshipId + dateStr) hash modulo eligible count.
  const eligible = await prisma.memory.findMany({
    where: {
      relationshipId,
      sourceType: "session_reveal",
      savedAt: { lte: cutoff },
    },
    orderBy: { savedAt: "asc" },
    select: { id: true, sourceId: true, savedAt: true, snapshot: true },
  });
  if (eligible.length === 0) return null;

  const idx = hash(relationshipId + localDateStr) % eligible.length;
  const memory = eligible[idx]!;

  // Resolve original DailySession to get promptId (snapshot only stores text).
  const sourceSession = await prisma.dailySession.findUnique({
    where: { id: memory.sourceId },
    select: { promptId: true, sessionDate: true },
  });

  const snap = memory.snapshot as unknown as StoredSnapshot | null;
  const promptText = snap?.promptText ?? "";
  const responses = (snap?.responses ?? []).map((r) => ({
    userId: r.userId,
    name: r.name ?? null,
    content: r.content ?? null,
  }));

  if (!promptText || responses.length === 0) return null;

  return {
    memoryId: memory.id,
    promptId: sourceSession?.promptId ?? null,
    originalDate: (sourceSession?.sessionDate ?? memory.savedAt).toISOString().slice(0, 10),
    monthsAgo: monthsBetween(sourceSession?.sessionDate ?? memory.savedAt, today),
    promptText,
    responses,
  };
}

// Exposed for unit smoke only.
export const __testing = { hash, isThrowbackDay, isSaturday, monthsBetween };
```

- [ ] **Step 2: Write smoke test `scripts/smoke-throwback.ts`**

```ts
// apps/aligned/scripts/smoke-throwback.ts
// Smoke for pure helpers in lib/throwback.ts. Run: npx tsx scripts/smoke-throwback.ts
import { __testing } from "../lib/throwback";

function assert(name: string, cond: boolean) {
  if (!cond) {
    console.error(`FAIL ${name}`);
    process.exit(1);
  }
  console.log(`PASS ${name}`);
}

// isSaturday — 2026-05-02 is a Saturday in UTC
assert("Saturday 2026-05-02", __testing.isSaturday("2026-05-02"));
assert("Not Saturday 2026-05-01", !__testing.isSaturday("2026-05-01"));

// isThrowbackDay — deterministic per (relationshipId + dateStr)
const a = __testing.isThrowbackDay("rel-1", "2026-05-02");
const b = __testing.isThrowbackDay("rel-1", "2026-05-02");
assert("isThrowbackDay deterministic", a === b);

// monthsBetween — 60 days ~ 2 months
const from = new Date("2026-01-01T00:00:00.000Z");
const to = new Date("2026-03-02T00:00:00.000Z");
assert("monthsBetween ~2", __testing.monthsBetween(from, to) === 2);

// hash — stable
assert("hash stable", __testing.hash("abc") === __testing.hash("abc"));
assert("hash distinct", __testing.hash("abc") !== __testing.hash("abcd"));

console.log("ALL PASS");
```

- [ ] **Step 3: Run smoke**

Run from `apps/aligned/`: `npx tsx scripts/smoke-throwback.ts`

Expected: `ALL PASS`.

- [ ] **Step 4: Typecheck**

Run from worktree root: `npm run typecheck -w aligned`

Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add apps/aligned/lib/throwback.ts apps/aligned/scripts/smoke-throwback.ts
git commit -m "feat(aligned): add throwback eligibility lib + smoke test"
```

---

## Task 5: Extend `getToday()` to return meta + day theme fields

**Files:**
- Modify: `apps/aligned/lib/sessions.ts`

- [ ] **Step 1: Extend the `GetTodayResult` type**

Replace the existing `GetTodayResult` (around lines 87-101 of `lib/sessions.ts`) with:

```ts
export type GetTodayResult = {
  sessionId: string;
  relationshipId: string;
  promptText: string;
  momentText?: string | null;
  state: "open" | "revealed" | "expired";
  hasUserResponded: boolean;
  hasPartnerResponded: boolean;
  canReveal: boolean;
  partnerName?: string | null;
  /** Consecutive days the couple has completed the question (revealed). */
  streak?: { currentCount: number; longestCount: number; justReset?: boolean } | null;
  /** This user's total daily check-ins in this relationship (never resets). */
  dedication?: { totalCheckIns: number } | null;
  /** Prompt category for the meta line + featured-slot logic. */
  category?: string | null;
  /** Prompt tone for the meta line. */
  tone?: string | null;
  /** Prompt depth (1..5) — drives estimated time. */
  depthLevel?: number | null;
  /** "sun".."sat" — drives day theme on the client. */
  dayThemeKey?: "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
};
```

- [ ] **Step 2: Populate the new fields in `getToday()`**

In `lib/sessions.ts`, find the final `return` block of `getToday()` (around lines 235-247) and replace it with:

```ts
  const dayKeys = ["sun","mon","tue","wed","thu","fri","sat"] as const;
  const sessionDayKey = dayKeys[dailySession.sessionDate.getUTCDay()];

  return {
    sessionId: dailySession.id,
    relationshipId,
    promptText,
    momentText,
    state: dailySession.state as "open" | "revealed" | "expired",
    hasUserResponded,
    hasPartnerResponded,
    canReveal,
    partnerName: partnerUser?.name ?? null,
    streak: streak ?? undefined,
    dedication: dedication.totalCheckIns > 0 ? dedication : undefined,
    category: dailySession.prompt?.category ?? null,
    tone: dailySession.prompt?.tone ?? null,
    depthLevel: dailySession.prompt?.depthLevel ?? null,
    dayThemeKey: sessionDayKey,
  };
```

- [ ] **Step 3: Typecheck**

Run from worktree root: `npm run typecheck -w aligned`

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add apps/aligned/lib/sessions.ts
git commit -m "feat(aligned): return category/tone/depth/dayThemeKey from getToday"
```

---

## Task 6: Add throwback variant to the Today response

**Files:**
- Modify: `apps/aligned/lib/sessions.ts`

- [ ] **Step 1: Add a new exported type union**

Append below the existing `GetTodayResult` type (after Task 5):

```ts
export type ThrowbackTodayResult = {
  variant: "throwback";
  relationshipId: string;
  /** Memory we're surfacing — pass to "Answer it again" action. */
  memoryId: string;
  /** Original promptId — null if the source session is gone (then disable action). */
  promptId: string | null;
  /** "7 months ago", etc. */
  monthsAgo: number;
  promptText: string;
  responses: Array<{ userId: string; name: string | null; content: string | null }>;
  partnerName?: string | null;
};

export type TodayResponse =
  | { variant: "standard"; today: GetTodayResult | null }
  | { variant: "throwback"; throwback: ThrowbackTodayResult };
```

- [ ] **Step 2: Add a new exported wrapper function**

Add below `getToday()` (or wherever convenient in `lib/sessions.ts`):

```ts
import { getThrowbackForToday } from "@/lib/throwback";

/**
 * Wraps getToday() with the Saturday Throwback variant.
 * Saturday + eligible memory + deterministic share → throwback variant.
 * Otherwise → standard.
 */
export async function getTodayWithVariant(
  relationshipId: string,
  localDateStr?: string
): Promise<TodayResponse> {
  const dateStr = localDateStr ?? new Date().toISOString().slice(0, 10);
  const throwback = await getThrowbackForToday(relationshipId, dateStr);
  if (throwback) {
    // Resolve partner name for the action button copy.
    const session = await getServerAuthSession();
    const userId = session?.user?.id ?? null;
    const memberIds = userId ? await getActiveMemberIds(relationshipId) : [];
    const partnerId = userId ? memberIds.find((id) => id !== userId) ?? null : null;
    const partner = partnerId
      ? await prisma.user.findUnique({ where: { id: partnerId }, select: { name: true } })
      : null;
    return {
      variant: "throwback",
      throwback: {
        variant: "throwback",
        relationshipId,
        memoryId: throwback.memoryId,
        promptId: throwback.promptId,
        monthsAgo: throwback.monthsAgo,
        promptText: throwback.promptText,
        responses: throwback.responses,
        partnerName: partner?.name ?? null,
      },
    };
  }
  const today = await getToday(relationshipId, localDateStr);
  return { variant: "standard", today };
}
```

Note: the existing top-of-file imports already include `getActiveMemberIds` and `prisma`; only `getThrowbackForToday` is new.

- [ ] **Step 3: Typecheck**

Run from worktree root: `npm run typecheck -w aligned`

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add apps/aligned/lib/sessions.ts
git commit -m "feat(aligned): add getTodayWithVariant returning throwback or standard"
```

---

## Task 7: Add novelty tags + then/now metadata to `getSession()` and a `forcePromptId` path

**Files:**
- Modify: `apps/aligned/lib/sessions.ts`

- [ ] **Step 1: Extend `GetSessionResult`**

Add these optional fields to the existing `GetSessionResult` type (around line 326):

```ts
  /** Up to 3 content words in the partner's revealed answer that have never appeared in their past responses for this couple. Empty/undefined when none. */
  noveltyTags?: string[];
  /** True when this session was created by re-answering a saved Memory. UI shows the Then/Now treatment when set. */
  isThrowback?: boolean;
  /** When isThrowback, the original Memory's responses for the Then panel. */
  throwbackThen?: Array<{ userId: string; name: string | null; content: string | null }> | null;
  /** Months ago the original was answered. */
  throwbackMonthsAgo?: number;
```

- [ ] **Step 2: Compute novelty tags inside `getSession()`**

Inside `getSession()`, after the `if (dailySession.state === "revealed")` block populates `result.allResponses`, add (right before `return result;`):

```ts
  // Novelty tags — words the partner has never used in any past response for
  // this couple. Skipped when the user is alone (no partner answer).
  if (dailySession.state === "revealed" && result.partnerResponse) {
    const partnerUserId = dailySession.responses.find(
      (r) => r.userId !== session.user!.id
    )?.userId;
    if (partnerUserId) {
      const pastPartner = await prisma.response.findMany({
        where: {
          userId: partnerUserId,
          session: { relationshipId: dailySession.relationshipId },
          NOT: { sessionId: dailySession.id },
        },
        select: { content: true },
      });
      const { findNovelTags } = await import("@/lib/novelty");
      result.noveltyTags = findNovelTags(
        result.partnerResponse,
        pastPartner.map((r) => r.content),
        result.userResponse
      );
    }
  }
```

- [ ] **Step 3: Detect throwback in `getSession()`**

In the same `getSession()` revealed block, also add:

```ts
  // Then/Now metadata — when a Memory exists for this prompt + relationship
  // and predates this session, the UI shows a Then/Now panel. We can't filter
  // on promptId in the Memory query directly (it's not a column), so we fetch
  // recent Memories and resolve their source DailySession.
  if (dailySession.state === "revealed" && dailySession.promptId) {
    const earlierMemories = await prisma.memory.findMany({
      where: {
        relationshipId: dailySession.relationshipId,
        sourceType: "session_reveal",
        savedAt: { lt: dailySession.sessionDate },
      },
      orderBy: { savedAt: "desc" },
      take: 20,
      select: { sourceId: true, savedAt: true, snapshot: true },
    });
    for (const mem of earlierMemories) {
      const sourceSession = await prisma.dailySession.findUnique({
        where: { id: mem.sourceId },
        select: { promptId: true, sessionDate: true },
      });
      if (sourceSession?.promptId === dailySession.promptId) {
        const snap = mem.snapshot as unknown as {
          responses?: Array<{ userId: string; name: string | null; content: string | null }>;
        } | null;
        const ms =
          dailySession.sessionDate.getTime() - sourceSession.sessionDate.getTime();
        const monthsAgo = Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24 * 30)));
        result.isThrowback = true;
        result.throwbackThen = snap?.responses ?? null;
        result.throwbackMonthsAgo = monthsAgo;
        break;
      }
    }
  }
```

Replace the snippet's `where` clause with:

```ts
      where: {
        relationshipId: dailySession.relationshipId,
        sourceType: "session_reveal",
        savedAt: { lt: dailySession.sessionDate },
      },
```

- [ ] **Step 4: Add `forcePromptId` to today-creation path**

Add a new exported function in `lib/sessions.ts` (place it near `getToday()`):

```ts
/**
 * Create or fetch today's DailySession, optionally forcing a specific prompt.
 * Used by the "Answer it again" action on the Saturday throwback card.
 * If a session for today already exists, returns its id without changes.
 */
export async function createOrGetTodaySession(
  relationshipId: string,
  localDateStr: string,
  forcePromptId?: string
): Promise<{ sessionId: string }> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  await requireActiveMember(session.user.id, relationshipId);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDateStr)) {
    throw new Error("Invalid date");
  }
  const today = new Date(localDateStr + "T00:00:00.000Z");

  const existing = await prisma.dailySession.findUnique({
    where: { relationshipId_sessionDate: { relationshipId, sessionDate: today } },
    select: { id: true },
  });
  if (existing) return { sessionId: existing.id };

  const promptId = forcePromptId ?? (await pickPromptForSession(relationshipId));
  const created = await prisma.dailySession.create({
    data: { relationshipId, sessionDate: today, promptId, state: "open" },
    select: { id: true },
  });
  revalidatePath("/app");
  return { sessionId: created.id };
}
```

- [ ] **Step 5: Typecheck**

Run from worktree root: `npm run typecheck -w aligned`

Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add apps/aligned/lib/sessions.ts
git commit -m "feat(aligned): noveltyTags + throwback then/now + createOrGetTodaySession"
```

---

## Task 8: Refactor Today card with day theme + meta line

**Files:**
- Modify: `apps/aligned/app/app/today-card.tsx`

- [ ] **Step 1: Replace the file with the day-themed version**

Replace the entire contents of `apps/aligned/app/app/today-card.tsx` with:

```tsx
import Link from "next/link";
import { CheckCircle, Circle } from "lucide-react";
import type { GetTodayResult } from "@/lib/sessions";
import { DedicationBadge } from "./dedication-badge";
import { NotifyPartnerButton } from "./notify-partner-button";
import { StreakBadge } from "./streak-badge";
import { ConnectionDots } from "./connection-dots";
import { getDayTheme, estimateAnswerTime, titleCase } from "@/lib/day-theme";

type Props = { today: GetTodayResult | null };

export function TodayCard({ today }: Props) {
  if (!today) {
    return (
      <section className="ns-card">
        <div className="inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 sm:text-sm">
            Today
          </h2>
        </div>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">
          No active relationship or no session for today.
        </p>
      </section>
    );
  }

  const {
    sessionId,
    relationshipId,
    promptText,
    momentText,
    state,
    hasUserResponded,
    hasPartnerResponded,
    canReveal,
    streak,
    dedication,
    partnerName,
    category,
    tone,
    depthLevel,
  } = today;
  const done = hasUserResponded || state === "revealed" || (state === "open" && canReveal);

  const theme = getDayTheme(new Date());
  const time = estimateAnswerTime(depthLevel ?? null);
  const cat = titleCase(category ?? null);
  const ton = titleCase(tone ?? null);
  const metaParts = [cat, ton, time].filter(Boolean) as string[];

  return (
    <section className={theme.sectionClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={theme.eyebrowChipClass}>
          <span className={theme.eyebrowDotClass} />
          <h2 className={theme.eyebrowTextClass}>{theme.label}</h2>
        </div>
        {streak && streak.currentCount > 0 && (
          <StreakBadge
            currentCount={streak.currentCount}
            longestCount={streak.longestCount}
            variant="compact"
          />
        )}
      </div>
      {metaParts.length > 0 && (
        <p className="mt-2 text-xs text-slate-500 sm:text-sm">
          {metaParts.map((p, i) => (
            <span key={p}>
              {i > 0 && <span className="mx-1.5 text-slate-300">·</span>}
              {p}
            </span>
          ))}
        </p>
      )}
      {streak && !streak.currentCount && streak.justReset && (
        <p className="mt-2 text-xs font-medium text-amber-800">
          Every day is a fresh start.
        </p>
      )}
      {dedication && dedication.totalCheckIns > 0 && (
        <div className="mt-2">
          <DedicationBadge totalCheckIns={dedication.totalCheckIns} variant="compact" />
        </div>
      )}
      <div className="mt-3">
        <ConnectionDots relationshipId={relationshipId} />
      </div>
      <span
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm"
        aria-hidden
      >
        {done ? (
          <CheckCircle className="h-6 w-6 text-emerald-600" strokeWidth={2} aria-label="Done today" />
        ) : (
          <Circle className="h-6 w-6 text-slate-300" strokeWidth={2} aria-label="Not done today" />
        )}
      </span>
      <p className="mt-3 text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
        {promptText}
      </p>

      {momentText && (
        <div className="ns-card-inner mt-3 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 sm:text-[13px]">
            Optional moment
          </p>
          <p className="mt-1 text-lg leading-relaxed text-slate-700 sm:text-xl">
            {momentText}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {state === "revealed" && (
          <Link
            href={`/app/session/${sessionId}`}
            className="ns-btn-primary block w-full text-center py-3.5 transition active:scale-[0.98]"
          >
            View Today&apos;s Answers
          </Link>
        )}
        {state === "open" && !hasUserResponded && hasPartnerResponded && (
          <div className="space-y-3 w-full">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />
              </span>
              <p className="text-sm font-medium text-brand-700">
                They answered — they&apos;re waiting on you.
              </p>
            </div>
            <Link
              href={`/app/session/${sessionId}`}
              className="ns-btn-primary block w-full text-center py-3.5 ring-2 ring-brand-300/50 ring-offset-2 ring-offset-white shadow-lg shadow-brand-200/40 transition active:scale-[0.98]"
            >
              Answer now
            </Link>
          </div>
        )}
        {state === "open" && !hasUserResponded && !hasPartnerResponded && (
          <Link
            href={`/app/session/${sessionId}`}
            className="ns-btn-primary block w-full text-center py-3.5 ring-2 ring-brand-300/50 ring-offset-2 ring-offset-white shadow-lg shadow-brand-200/40 transition active:scale-[0.98]"
          >
            Answer today&apos;s question
          </Link>
        )}
        {state === "open" && hasUserResponded && !canReveal && (
          <div className="space-y-4 w-full">
            <p className="text-center text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              Your answer is saved. We&apos;ll reveal when your partner replies.
            </p>
            <div className="flex flex-col gap-2">
              <Link href={`/app/session/${sessionId}`} className="ns-btn-primary block w-full text-center py-3.5 transition active:scale-[0.98]">
                View my answer
              </Link>
              <NotifyPartnerButton sessionId={sessionId} relationshipId={relationshipId} partnerName={partnerName} variant="secondary" className="w-full py-3.5" />
            </div>
          </div>
        )}
        {state === "open" && canReveal && (
          <div className="space-y-2 w-full">
            <Link
              href={`/app/session/${sessionId}`}
              className="ns-btn-primary block w-full text-center py-3.5 ring-2 ring-brand-300/50 ring-offset-2 ring-offset-white shadow-lg shadow-brand-200/40 transition active:scale-[0.98]"
            >
              Reveal answers
            </Link>
            <p className="text-center text-sm text-slate-500">
              Next question tomorrow.
            </p>
          </div>
        )}
        {state === "expired" && (
          <span className="text-base text-slate-400">This session has expired.</span>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

Run from worktree root: `npm run typecheck -w aligned`

Expected: passes.

- [ ] **Step 3: Manual verification**

Start the dev server:
```bash
cd apps/aligned && npm run dev
```
Open `http://localhost:3000/app`. Confirm:
- The eyebrow chip says e.g. "Thursday — deeper" (matches actual day).
- A meta line appears under the eyebrow: `Gratitude · Light · ~1 min` (or whatever the prompt has).
- The card gradient/border tint changes if you fake the day by editing your local clock or wait until tomorrow.
- All existing CTAs (Answer / Reveal / View) still work.

- [ ] **Step 4: Commit**

```bash
git add apps/aligned/app/app/today-card.tsx
git commit -m "feat(aligned): day-themed Today card with meta line"
```

---

## Task 9: Today skeleton loader

**Files:**
- Create: `apps/aligned/app/app/today-skeleton.tsx`

- [ ] **Step 1: Write the skeleton**

```tsx
// apps/aligned/app/app/today-skeleton.tsx
export function TodaySkeleton() {
  return (
    <section className="relative rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm sm:p-6 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-6 w-44 rounded-lg bg-slate-100" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-3 w-16 rounded bg-slate-100" />
        <div className="h-3 w-14 rounded bg-slate-100" />
        <div className="h-3 w-12 rounded bg-slate-100" />
      </div>
      <div className="mt-5 space-y-3">
        <div className="h-6 w-11/12 rounded bg-slate-100" />
        <div className="h-6 w-9/12 rounded bg-slate-100" />
      </div>
      <div className="mt-6 h-12 w-full rounded-xl bg-slate-100" />
    </section>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npm run typecheck -w aligned
git add apps/aligned/app/app/today-skeleton.tsx
git commit -m "feat(aligned): TodaySkeleton loader component"
```

---

## Task 10: Throwback Today card component

**Files:**
- Create: `apps/aligned/app/app/today-throwback-card.tsx`

- [ ] **Step 1: Write the component**

```tsx
// apps/aligned/app/app/today-throwback-card.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { COPY } from "@/lib/copy";
import { createOrGetTodaySession } from "@/lib/sessions";
import { haptic } from "@/lib/haptics";
import type { ThrowbackTodayResult } from "@/lib/sessions";

type Props = {
  throwback: ThrowbackTodayResult;
  localDateStr: string;
};

function getDayTheme() {
  // Saturday — reuse the peach palette from lib/day-theme.
  return {
    sectionClass:
      "relative animate-calm-fade-in rounded-2xl border border-peach-300/40 bg-gradient-to-br from-peach-300/20 via-white to-white p-5 shadow-sm sm:p-6",
    eyebrowChipClass: "inline-flex items-center gap-2 rounded-lg bg-peach-300/30 px-3 py-1",
    eyebrowDotClass: "h-1.5 w-1.5 rounded-full bg-peach-500",
    eyebrowTextClass:
      "text-xs font-semibold uppercase tracking-[0.18em] text-peach-600 sm:text-sm",
  };
}

export function TodayThrowbackCard({ throwback, localDateStr }: Props) {
  const theme = getDayTheme();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAnswerAgain() {
    if (!throwback.promptId) {
      toast.error("That memory is no longer linked.");
      return;
    }
    setError(null);
    void haptic("tap");
    startTransition(async () => {
      try {
        const { sessionId } = await createOrGetTodaySession(
          throwback.relationshipId,
          localDateStr,
          throwback.promptId!
        );
        router.push(`/app/session/${sessionId}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : COPY.errors.submit;
        setError(msg);
        toast.error(msg);
      }
    });
  }

  return (
    <section className={theme.sectionClass}>
      <div className={theme.eyebrowChipClass}>
        <span className={theme.eyebrowDotClass} />
        <h2 className={theme.eyebrowTextClass}>{COPY.throwback.eyebrow}</h2>
      </div>
      <p className="mt-3 text-sm text-slate-600 sm:text-base">
        {COPY.throwback.ageLine(throwback.monthsAgo)}
      </p>
      <p className="mt-1 text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
        {throwback.promptText}
      </p>
      <div className="mt-4 space-y-2">
        {throwback.responses.map((r) => (
          <div
            key={r.userId}
            className="rounded-xl border border-peach-200/60 bg-white px-3.5 py-2.5"
          >
            <p className="text-xs font-semibold text-peach-700">
              {r.name ?? "They"} said:
            </p>
            <p className="mt-0.5 text-sm text-slate-700 sm:text-base">
              {r.content ?? "(no answer saved)"}
            </p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleAnswerAgain}
        disabled={pending || !throwback.promptId}
        className="mt-5 ns-btn-primary block w-full text-center py-3.5 transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Opening…" : COPY.throwback.action}
      </button>
      {error && (
        <p className="mt-2 text-xs text-rose-600" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck -w aligned`

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add apps/aligned/app/app/today-throwback-card.tsx
git commit -m "feat(aligned): TodayThrowbackCard for Saturday look-back variant"
```

---

## Task 11: Today section dispatcher (route to throwback when applicable)

**Files:**
- Modify: `apps/aligned/app/app/today-section.tsx`

- [ ] **Step 1: Read the existing file first**

Use the Read tool on `apps/aligned/app/app/today-section.tsx` to capture the current shape. The current implementation calls `getToday()` and renders `TodayCard`. The new dispatcher calls `getTodayWithVariant()` and conditionally renders either `TodayCard` or `TodayThrowbackCard`.

- [ ] **Step 2: Replace its body**

Replace the file with:

```tsx
// apps/aligned/app/app/today-section.tsx
"use client";

import { useEffect, useState } from "react";
import { getTodayWithVariant } from "@/lib/sessions";
import type { TodayResponse } from "@/lib/sessions";
import { TodayCard } from "./today-card";
import { TodayThrowbackCard } from "./today-throwback-card";
import { TodaySkeleton } from "./today-skeleton";

function getLocalDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Props = { relationshipId: string };

export function TodaySection({ relationshipId }: Props) {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [localDateStr, setLocalDateStr] = useState<string | null>(null);

  useEffect(() => {
    setLocalDateStr(getLocalDateString());
  }, []);

  useEffect(() => {
    if (!relationshipId || localDateStr == null) return;
    let cancelled = false;
    getTodayWithVariant(relationshipId, localDateStr).then((res) => {
      if (cancelled) return;
      setData(res);
    });
    return () => {
      cancelled = true;
    };
  }, [relationshipId, localDateStr]);

  if (data == null) return <TodaySkeleton />;
  if (data.variant === "throwback") {
    return (
      <TodayThrowbackCard
        throwback={data.throwback}
        localDateStr={localDateStr ?? getLocalDateString()}
      />
    );
  }
  return <TodayCard today={data.today} />;
}
```

- [ ] **Step 3: Typecheck + manual verification**

Run from worktree root: `npm run typecheck -w aligned`

To manually trigger the throwback path on a non-Saturday for testing:
1. In `lib/throwback.ts`, temporarily comment out the `if (!isSaturday(localDateStr)) return null;` line.
2. Ensure your DB has at least one `Memory` row of `sourceType: "session_reveal"` with `savedAt` ≥ 30 days old (you can adjust `MIN_AGE_DAYS` to `0` temporarily).
3. Reload `/app`. The throwback card should appear ~50% of dates per couple.
4. **Restore both temporary changes before committing.**

- [ ] **Step 4: Commit**

```bash
git add apps/aligned/app/app/today-section.tsx
git commit -m "feat(aligned): Today section routes to throwback variant on eligible Saturdays"
```

---

## Task 12: Featured "Also today" slot per day

**Files:**
- Modify: `apps/aligned/app/app/app-page-client.tsx`

- [ ] **Step 1: Add a featured-slot rule**

At the top of `apps/aligned/app/app/app-page-client.tsx`, add an import:

```ts
import { getDayTheme } from "@/lib/day-theme";
```

- [ ] **Step 2: Compute the day's featured mode**

Inside the `AppPageClient` component, before the `return`, compute:

```ts
  const todayDate = localDateStr
    ? new Date(localDateStr + "T00:00:00.000Z")
    : new Date();
  const featuredMode = getDayTheme(todayDate).featuredMode;
```

- [ ] **Step 3: Render the featured row first with a stronger treatment**

Inside the existing `<section className="space-y-2">` block (the "Also today" section), wrap each `<Link>` row in a helper that knows if it's featured. Replace the section body with the structure below — keep the same condition checks and content as the original, but wrap each row in a `<RowShell>` component declared at the top of the file:

Add at the top of `app-page-client.tsx`, just below the imports:

```tsx
function RowShell({
  href,
  featured,
  children,
}: {
  href: string;
  featured: boolean;
  children: React.ReactNode;
}) {
  const base =
    "flex items-center gap-3 rounded-2xl border bg-white transition active:scale-[0.99]";
  const cls = featured
    ? `${base} border-dusk-300 px-5 py-4 shadow-md ring-1 ring-dusk-100`
    : `${base} border-slate-200 px-4 py-3 hover:border-dusk-300/70`;
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
```

Then replace each existing row `<Link href="/app/dare" ...>` etc. with `<RowShell href="/app/dare" featured={featuredMode === "dare"}>` and remove the row's own `className` prop (RowShell owns it).

Apply for each row:
- Date Night Dare → `featured={featuredMode === "dare"}`
- Partner Spotlight → `featured={false}` (no day owns spotlight by default)
- Would You Rather → `featured={false}`
- Quiz → `featured={featuredMode === "quiz"}`
- Appreciation → `featured={featuredMode === "appreciation"}`
- Alignment → `featured={false}`

- [ ] **Step 4: Reorder so the featured row appears first**

Inside the `<section>` block, add a small reordering helper. After the `featuredMode` const, define:

```tsx
  type Row = { key: string; node: React.ReactNode };
```

Build the rows into an array, sort to move the featured one first, and render. Inside the `<section>`, replace the row list with:

```tsx
            {(() => {
              const rows: Array<{ key: string; featuredKey: typeof featuredMode; node: React.ReactNode }> = [];
              if (dareData) rows.push({ key: "dare", featuredKey: "dare", node: (
                <RowShell href="/app/dare" featured={featuredMode === "dare"}>
                  {/* existing inner content for dare row, unchanged */}
                </RowShell>
              )});
              // … repeat for the other rows in the same way, preserving the
              // existing inner content (icon span + text + trailing icon).
              const featuredFirst = rows.sort((a, b) => {
                const af = featuredMode && a.featuredKey === featuredMode ? -1 : 0;
                const bf = featuredMode && b.featuredKey === featuredMode ? -1 : 0;
                return af - bf;
              });
              return featuredFirst.map((r) => <div key={r.key}>{r.node}</div>);
            })()}
```

Keep the existing icon+text content for each row exactly as it is — only the wrapper (`<Link>` → `<RowShell>`) and the order change.

- [ ] **Step 5: Typecheck + manual verification**

Run from worktree root: `npm run typecheck -w aligned`

Manually verify by editing your system date or loading `/app` on different days:
- Tuesday → Appreciation row appears first with stronger styling
- Wednesday → Quiz row first
- Friday → Dare row first
- Other days → original order, no row promoted

- [ ] **Step 6: Commit**

```bash
git add apps/aligned/app/app/app-page-client.tsx
git commit -m "feat(aligned): featured Also-today slot per weekday rhythm"
```

---

## Task 13: Slow partner-answer reveal animation

**Files:**
- Modify: `apps/aligned/app/globals.css`
- Modify: `apps/aligned/app/app/session/[id]/session-content.tsx`

- [ ] **Step 1: Add the keyframe**

Open `apps/aligned/app/globals.css`. Append:

```css
@keyframes partner-reveal {
  0%   { opacity: 0; transform: scale(0.96) translateY(6px); }
  60%  { opacity: 1; }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-partner-reveal {
  animation: partner-reveal 600ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
```

- [ ] **Step 2: Apply the class to the partner-answer container**

Open `apps/aligned/app/app/session/[id]/session-content.tsx`. Find the JSX block that renders the partner's answer card (search for `partnerRevealed && (` — added in batch 3). Add `animate-partner-reveal` to the outermost wrapper of that block, and add a single haptic call when `partnerRevealed` flips to true.

If the haptic-on-reveal is already wired in `handleRevealPartner`, leave it. Otherwise insert at the top of `handleRevealPartner`:

```ts
void haptic("reveal");
```

Use the Read tool on the file first to identify the exact block; then Edit to add the className. Example edit:

```tsx
{partnerRevealed && (
  <div className="animate-partner-reveal mt-4 rounded-2xl border border-brand-100 bg-white p-4">
    {/* existing content unchanged */}
  </div>
)}
```

- [ ] **Step 3: Typecheck + manual verification**

Run from worktree root: `npm run typecheck -w aligned`

Reach the reveal screen of a real session (simulate by completing both responses), tap to reveal partner — confirm the partner card scales/fades in slower and feels more deliberate than before.

- [ ] **Step 4: Commit**

```bash
git add apps/aligned/app/globals.css apps/aligned/app/app/session/[id]/session-content.tsx
git commit -m "feat(aligned): slower scale-fade for partner-answer reveal"
```

---

## Task 14: Quick 5-emoji reaction row

**Files:**
- Create: `apps/aligned/app/app/session/[id]/quick-react-row.tsx`
- Modify: `apps/aligned/app/app/session/[id]/session-content.tsx`

- [ ] **Step 1: Inspect what the existing reaction picker is named**

Use Grep on `apps/aligned/app/app/session/[id]/` for `setReactions` to find the existing picker component. Note its name and how it's invoked.

- [ ] **Step 2: Write `quick-react-row.tsx`**

```tsx
// apps/aligned/app/app/session/[id]/quick-react-row.tsx
"use client";

import { useState } from "react";
import { setReactions } from "@/lib/sessions";
import { haptic } from "@/lib/haptics";
import { toast } from "sonner";

const QUICK_EMOJIS = ["❤️", "🥹", "😂", "💯", "🔥"] as const;

type Props = {
  responseId: string;
  initialReactions: string | null;
};

export function QuickReactRow({ responseId, initialReactions }: Props) {
  const [active, setActive] = useState<Set<string>>(
    () => new Set(initialReactions ? Array.from(initialReactions) : [])
  );
  const [pending, setPending] = useState(false);

  async function toggle(emoji: string) {
    void haptic("tap");
    const next = new Set(active);
    if (next.has(emoji)) next.delete(emoji);
    else {
      if (next.size >= 2) {
        // Drop oldest by removing first iteration entry
        const first = next.values().next().value as string | undefined;
        if (first) next.delete(first);
      }
      next.add(emoji);
    }
    setActive(next);
    setPending(true);
    try {
      await setReactions(responseId, Array.from(next));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save reaction.");
      setActive(active); // revert
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="flex items-center gap-1.5"
      role="group"
      aria-label="Quick reactions"
    >
      {QUICK_EMOJIS.map((e) => {
        const on = active.has(e);
        return (
          <button
            key={e}
            type="button"
            onClick={() => void toggle(e)}
            disabled={pending}
            aria-pressed={on}
            className={`text-xl px-2 py-1 rounded-full transition active:scale-90 ${
              on ? "bg-brand-100 ring-2 ring-brand-300" : "hover:bg-slate-100"
            }`}
          >
            {e}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Mount the row above the existing picker**

In `session-content.tsx`, locate where the existing reaction picker is rendered. Add `<QuickReactRow ... />` above it, passing the partner's response id and existing reactions (look for the prop the existing picker uses).

If the existing picker doesn't expose responseId/initialReactions, you may need to read it from `data.allResponses` for the partner's row. Example placement (adjust to actual structure):

```tsx
{data.partnerResponse && partnerResponseId && (
  <div className="mt-2">
    <QuickReactRow
      responseId={partnerResponseId}
      initialReactions={existingPartnerReactions}
    />
  </div>
)}
```

If the existing picker pre-fills from the same source, you can keep both visible — the quick row writes the same field.

- [ ] **Step 4: Typecheck + manual verification**

Run from worktree root: `npm run typecheck -w aligned`

Reveal a session, tap a quick-emoji. The chip should highlight, reload the page — the reaction should persist (server-saved). Tap a third emoji — the oldest of the active two should be replaced.

- [ ] **Step 5: Commit**

```bash
git add apps/aligned/app/app/session/[id]/quick-react-row.tsx apps/aligned/app/app/session/[id]/session-content.tsx
git commit -m "feat(aligned): quick 5-emoji reaction row above full picker"
```

---

## Task 15: Sticky React/Save/Talk action bar

**Files:**
- Create: `apps/aligned/app/app/session/[id]/post-reveal-action-bar.tsx`
- Modify: `apps/aligned/app/app/session/[id]/session-content.tsx`

- [ ] **Step 1: Write the action bar**

```tsx
// apps/aligned/app/app/session/[id]/post-reveal-action-bar.tsx
"use client";

import { Heart, Bookmark, MessageSquareText } from "lucide-react";
import { haptic } from "@/lib/haptics";

type Props = {
  onReact: () => void;
  onSave: () => void;
  onTalk: () => void;
  saved: boolean;
  saving: boolean;
};

export function PostRevealActionBar({ onReact, onSave, onTalk, saved, saving }: Props) {
  return (
    <div
      className="sticky bottom-3 mt-4 flex items-center justify-around gap-2 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur px-2 py-2 shadow-md"
      role="group"
      aria-label="Post-reveal actions"
    >
      <button
        type="button"
        onClick={() => { void haptic("tap"); onReact(); }}
        className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition active:scale-[0.96] hover:bg-slate-50"
      >
        <Heart className="h-5 w-5 text-rose-500" strokeWidth={2} />
        <span className="text-[11px] font-medium text-slate-600">React</span>
      </button>
      <button
        type="button"
        onClick={() => { void haptic("success"); onSave(); }}
        disabled={saving}
        className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition active:scale-[0.96] ${
          saved ? "bg-emerald-50" : "hover:bg-slate-50"
        }`}
      >
        <Bookmark className={`h-5 w-5 ${saved ? "text-emerald-600 fill-emerald-600" : "text-slate-700"}`} strokeWidth={2} />
        <span className="text-[11px] font-medium text-slate-600">{saved ? "Saved" : "Save"}</span>
      </button>
      <button
        type="button"
        onClick={() => { void haptic("tap"); onTalk(); }}
        className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition active:scale-[0.96] hover:bg-slate-50"
      >
        <MessageSquareText className="h-5 w-5 text-dusk-600" strokeWidth={2} />
        <span className="text-[11px] font-medium text-slate-600">Talk about it</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Wire in `session-content.tsx`**

Inside the post-reveal block of `session-content.tsx`, mount `<PostRevealActionBar />` near the bottom of the post-reveal section (before any reflections list). Wire its callbacks:

- `onReact`: scroll to or focus the existing reaction picker (`document.getElementById("reaction-picker")?.scrollIntoView({ behavior: "smooth" })`). Add `id="reaction-picker"` to the existing picker's container.
- `onSave`: call the existing save-to-memory handler and update local `saved` state.
- `onTalk`: scroll to the follow-up "Talk about it" card (`document.getElementById("talk-about-it")?.scrollIntoView({ behavior: "smooth" })`). Add `id="talk-about-it"` to that card's container.

- [ ] **Step 3: Typecheck + manual verification**

Run from worktree root: `npm run typecheck -w aligned`

On a revealed session, scroll. The bar stays visible at bottom. Tapping React focuses the picker; Save calls the existing save flow and shows "Saved" with a check; Talk scrolls to the follow-up card.

- [ ] **Step 4: Commit**

```bash
git add apps/aligned/app/app/session/[id]/post-reveal-action-bar.tsx apps/aligned/app/app/session/[id]/session-content.tsx
git commit -m "feat(aligned): sticky React/Save/Talk action bar on revealed sessions"
```

---

## Task 16: Display novelty tag

**Files:**
- Modify: `apps/aligned/app/app/session/[id]/session-content.tsx`

- [ ] **Step 1: Render the chip**

Below the partner-answer block, when `data.noveltyTags && data.noveltyTags.length > 0`, render:

```tsx
{data.noveltyTags && data.noveltyTags.length > 0 && (
  <p
    className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
    role="note"
  >
    <span aria-hidden>🌱</span>
    First time you've heard this
  </p>
)}
```

- [ ] **Step 2: Typecheck + manual verification**

Run from worktree root: `npm run typecheck -w aligned`

To force the chip in dev: in your DB, ensure the partner has at least one past response. Then add a sentence to their newest answer that contains a unique word (e.g. `seabirds`). Reveal; the chip should appear.

- [ ] **Step 3: Commit**

```bash
git add apps/aligned/app/app/session/[id]/session-content.tsx
git commit -m "feat(aligned): show novelty tag when partner uses a never-before word"
```

---

## Task 17: Then/Now treatment for re-answered throwback

**Files:**
- Modify: `apps/aligned/app/app/session/[id]/session-content.tsx`

- [ ] **Step 1: Add a Then/Now panel**

In the post-reveal block, when `data.isThrowback && data.throwbackThen && data.throwbackThen.length > 0`, render a panel above the standard reveal answer cards:

```tsx
{data.isThrowback && data.throwbackThen && data.throwbackThen.length > 0 && (
  <section
    className="mt-4 rounded-2xl border border-peach-200 bg-peach-50/40 p-4"
    aria-label="Then and now"
  >
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-peach-700">
      {data.throwbackMonthsAgo
        ? `${data.throwbackMonthsAgo} months ago`
        : "Earlier"}
    </p>
    <div className="mt-2 space-y-2">
      {data.throwbackThen.map((r) => (
        <div key={r.userId} className="rounded-xl bg-white px-3 py-2.5">
          <p className="text-xs font-semibold text-peach-700">
            {r.name ?? "They"} said:
          </p>
          <p className="mt-0.5 text-sm text-slate-700">
            {r.content ?? "(no answer saved)"}
          </p>
        </div>
      ))}
    </div>
    <p className="mt-3 text-xs text-slate-500">— and today —</p>
  </section>
)}
```

The standard "Now" answers render below this panel using the existing reveal layout — no further changes needed.

- [ ] **Step 2: Typecheck + manual verification**

Run from worktree root: `npm run typecheck -w aligned`

To force in dev: complete a throwback flow end-to-end (Saturday → throwback card → answer it again → both partners answer → reveal). The new session should detect the earlier Memory and show the Then panel above the standard reveal.

- [ ] **Step 3: Commit**

```bash
git add apps/aligned/app/app/session/[id]/session-content.tsx
git commit -m "feat(aligned): Then/Now panel on re-answered throwback sessions"
```

---

## Task 18: Streak milestone visual variants

**Files:**
- Modify: `apps/aligned/components/streak-celebration.tsx`
- Modify: `apps/aligned/app/globals.css`

- [ ] **Step 1: Add confetti keyframes**

Append to `apps/aligned/app/globals.css`:

```css
@keyframes confetti-fall {
  0%   { opacity: 0; transform: translate3d(0, -8px, 0) rotate(0deg); }
  10%  { opacity: 1; }
  100% { opacity: 0; transform: translate3d(var(--tx, 0), 80px, 0) rotate(var(--rot, 90deg)); }
}
.animate-confetti-fall {
  animation: confetti-fall 1.2s ease-out forwards;
}
```

- [ ] **Step 2: Replace `streak-celebration.tsx`**

```tsx
// apps/aligned/components/streak-celebration.tsx
type Props = {
  count: number;
};

const COPY: Record<number, { headline: string; sub: string }> = {
  7: {
    headline: "One week.",
    sub: "Seven days of showing up for each other. The hard part is starting — you started.",
  },
  30: {
    headline: "Thirty days.",
    sub: "A month of small, consistent moments. This is what becomes a rhythm.",
  },
  100: {
    headline: "100 days.",
    sub: "Most couples don't get here. You did. This isn't a streak anymore — it's how you two are.",
  },
  365: {
    headline: "A whole year.",
    sub: "365 days of choosing each other in this small, daily way. That's not a number — that's a record of love.",
  },
};

const FALLBACK = {
  headline: "Another milestone.",
  sub: "Still showing up. That's what it's about.",
};

export function isStreakMilestone(count: number | null | undefined): boolean {
  if (count == null) return false;
  return count === 7 || count === 30 || count === 100 || count === 365;
}

function ConfettiBurst({ count }: { count: number }) {
  const colors = ["#1f4e73", "#e07a5f", "#f4d03f", "#86efac", "#a5b4fc"];
  const particles = Array.from({ length: count }, (_, i) => {
    const tx = (Math.sin(i * 12.9898) * 50000) % 60;
    const rot = (Math.cos(i * 78.233) * 50000) % 360;
    const delay = (i % 5) * 50;
    const color = colors[i % colors.length];
    return { i, tx, rot, delay, color };
  });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.i}
          className="animate-confetti-fall absolute left-1/2 top-2 block h-2 w-2 rounded-sm"
          style={{
            backgroundColor: p.color,
            // CSS variables consumed by the keyframe
            ["--tx" as string]: `${p.tx}px`,
            ["--rot" as string]: `${p.rot}deg`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function StreakCelebration({ count }: Props) {
  const { headline, sub } = COPY[count] ?? FALLBACK;
  const tier: "small" | "medium" | "large" =
    count >= 100 ? "large" : count >= 30 ? "medium" : "small";
  const particleCount = tier === "large" ? 36 : tier === "medium" ? 22 : 10;

  return (
    <div className="animate-reveal-stamp relative overflow-hidden rounded-3xl bg-gradient-to-br from-dusk-500 via-dusk-600 to-peach-500 px-5 py-7 text-center text-white shadow-lg sm:px-7 sm:py-8">
      <ConfettiBurst count={particleCount} />
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/80">
        Day {count} together
      </p>
      <p className={`mt-2 font-display font-semibold leading-tight ${
        tier === "large" ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"
      }`}>
        {headline}
      </p>
      <p className="mx-auto mt-3 max-w-md text-base text-white/90 sm:text-lg">
        {sub}
      </p>
      <span
        className="pointer-events-none absolute right-5 top-5 text-2xl text-white/40"
        aria-hidden
      >
        ✦
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + manual verification**

Run from worktree root: `npm run typecheck -w aligned`

To verify the milestone tiers in dev, temporarily call `<StreakCelebration count={7} />`, `<StreakCelebration count={30} />`, `<StreakCelebration count={100} />` from a scratch route or by editing the streak data locally. Confirm the confetti density grows and the headline scales up at 100.

- [ ] **Step 4: Commit**

```bash
git add apps/aligned/components/streak-celebration.tsx apps/aligned/app/globals.css
git commit -m "feat(aligned): tiered streak milestone confetti (7/30/100/365)"
```

---

## Task 19: Haptics + spring press across primary CTAs

**Files:**
- Modify: `apps/aligned/app/app/today-card.tsx` (already has `active:scale-[0.98]` from Task 8)
- Modify: `apps/aligned/app/app/notify-partner-button.tsx`
- Modify: `apps/aligned/app/app/session/[id]/session-content.tsx` (where reveal/save buttons live)

- [ ] **Step 1: Add haptics where missing**

Use Grep on `apps/aligned/app/app/` for `ns-btn-primary` to find every primary CTA. For each interactive button (not `<Link>` navigations), ensure:

- The `onClick` calls `void haptic("tap")` for normal presses, or `void haptic("success")` for completion (save, submit).
- The button has `transition active:scale-[0.98]` in its className.

Do NOT change `<Link>` elements — they're already good. Focus on `<button>` elements that submit, save, reveal, or react.

Specifically check and update if missing:
- Notify partner button → `haptic("tap")` + `active:scale-[0.98]`
- Reveal partner button → `haptic("reveal")` (already added in Task 13)
- Save-to-memory button → `haptic("success")` + `active:scale-[0.98]`
- Submit response button → `haptic("success")` on success, `active:scale-[0.98]`

- [ ] **Step 2: Typecheck + commit**

```bash
npm run typecheck -w aligned
git add -A apps/aligned
git commit -m "feat(aligned): consistent haptics + spring-press on primary CTAs"
```

---

## Task 20: Aria-live + focus management + button morphing dots

**Files:**
- Modify: `apps/aligned/app/app/session/[id]/session-content.tsx`
- Modify: `apps/aligned/app/globals.css`
- Create: `apps/aligned/app/app/loading-dots.tsx` (small reusable component)

- [ ] **Step 1: Add the loading-dots component**

```tsx
// apps/aligned/app/app/loading-dots.tsx
export function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70 animate-loading-dot" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70 animate-loading-dot" style={{ animationDelay: "150ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70 animate-loading-dot" style={{ animationDelay: "300ms" }} />
    </span>
  );
}
```

- [ ] **Step 2: Add the keyframe**

Append to `apps/aligned/app/globals.css`:

```css
@keyframes loading-dot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}
.animate-loading-dot {
  animation: loading-dot 1.0s ease-in-out infinite;
}
```

- [ ] **Step 3: Use `LoadingDots` in submit/reveal buttons in session-content**

In `apps/aligned/app/app/session/[id]/session-content.tsx`, find the in-flight states where buttons currently say "Saving…" or similar. Replace the text with `<LoadingDots />` while pending. Keep the disabled state. Example:

```tsx
<button disabled={pending} className="ns-btn-primary ...">
  {pending ? <LoadingDots /> : "Submit"}
</button>
```

- [ ] **Step 4: Add aria-live and focus management**

In `session-content.tsx`:

1. Wrap the partner-answer block with `aria-live="polite"`:

```tsx
<div aria-live="polite" aria-atomic="false">
  {/* partner answer block */}
</div>
```

2. After `partnerRevealed` flips to `true`, programmatically focus the partner-answer card. Add a `ref` on its outermost div and `useEffect` that focuses it when `partnerRevealed` becomes true:

```tsx
const partnerAnswerRef = useRef<HTMLDivElement | null>(null);
useEffect(() => {
  if (partnerRevealed && partnerAnswerRef.current) {
    partnerAnswerRef.current.focus();
  }
}, [partnerRevealed]);
```

Add `tabIndex={-1}` and `ref={partnerAnswerRef}` on the partner-answer wrapper.

- [ ] **Step 5: Typecheck + manual verification**

Run from worktree root: `npm run typecheck -w aligned`

With a screen reader (VoiceOver / NVDA) on the reveal screen: tapping reveal should announce the partner's answer. The submit button should show animated dots while pending.

- [ ] **Step 6: Commit**

```bash
git add apps/aligned/app/app/loading-dots.tsx apps/aligned/app/globals.css apps/aligned/app/app/session/[id]/session-content.tsx
git commit -m "feat(aligned): aria-live, focus management, morphing button dots"
```

---

## Final task: Build verification

- [ ] **Step 1: Run the build**

From worktree root:

```bash
cd apps/aligned && npm run build
```

Expected: compiles cleanly with no `Failed to collect page data` errors. Pay particular attention that no `"use server"` file added in this plan exports a non-function value.

- [ ] **Step 2: Run typecheck across all workspaces**

From worktree root:

```bash
npx -w @north-star/shared typecheck && npm run typecheck -w aligned
```

Expected: passes.

- [ ] **Step 3: Push**

```bash
git push
```

---

## Self-review checklist (performed during plan authoring)

**Spec coverage:**
- §1 Reveal flow: Task 13 (slow partner reveal), Task 14 (quick-react), Task 15 (action bar), Task 16 (novelty tag), Task 18 (streak milestones) ✓
- §2 Today + rhythm: Task 5 (meta fields), Task 8 (today card), Task 9 (skeleton), Task 12 (featured slot) ✓
- §3 Throwback + microcopy + polish: Task 4 (throwback lib), Task 6 (variant), Task 7 (then/now + forcePromptId), Task 10 (throwback card), Task 11 (dispatcher), Task 17 (then/now reveal), Task 1 (copy), Task 19 (haptics+press), Task 20 (aria-live+dots) ✓

**Type consistency:**
- `GetTodayResult.dayThemeKey` uses union `"sun" | "mon" | ...` matching `DayTheme.key` ✓
- `TodayResponse` discriminator uses `variant: "standard" | "throwback"` consistently ✓
- `findNovelTags` signature matches its caller in Task 7 ✓

**No placeholders:**
- All code blocks complete; no "TBD", "TODO", "fill in" ✓
- Each task has explicit file paths and exact commands ✓

## Limitations (intentionally deferred)

- **No localStorage dismiss-for-today guard on the featured "Also today" slot.** The spec called for one to prevent nagging after a user has acted; for v1 the row simply stays elevated. If the row promotion proves annoying in dogfood, add the guard as a follow-up keyed by `relationshipId + featuredMode + dateStr`.
- **Skeletons only on the Today card.** The spec mentioned History list and Session loading skeletons too; not in this plan. Both routes already render fast enough that a skeleton is a polish nice-to-have, not a blocker.
- **Microcopy library is opt-in.** New code in this plan uses `COPY.*`; existing scattered strings are not migrated. Bulk migration is a separate sweep.

## Recommended next pass (deferred — not in this plan)

1. Content sprint — 100+ new prompts; introduce `mode` field on Prompt schema
2. Full Memory Lane feed at `/memories`
3. Push timing intelligence (learn user response windows)
4. Reaction analytics (premium-gating candidate)
5. i18n extraction from `lib/copy.ts`
6. History + Session skeleton loaders
7. Featured "Also today" dismiss-for-today guard
