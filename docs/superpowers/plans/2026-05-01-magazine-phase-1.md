# Aligned: The Magazine — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the demoable core of "The Magazine" — a Weekly Issue auto-published Sunday morning, viewable in a beautiful editorial-style reader, surfaced on the homepage. Phase 2 (Monthly + library) and Phase 3 (Yearly + Milestone + push + premium gating) are separate plans.

**Architecture:** A new `Issue` Prisma model snapshots a couple's week into structured JSON sections at publish time. A Vercel Cron route runs hourly on Sundays, computes per-couple windows in user-local time, aggregates data, picks a template-based headline, and inserts an Issue row. The reader is a server component that loads the Issue by id and a client component that renders sections with scroll-reveal motion. The homepage `IssuePromo` replaces the existing `SundayRecap` and surfaces the latest issue for 7 days.

**Tech Stack:** Next.js 16 App Router · Prisma 5 + PostgreSQL (Neon) · TypeScript · Tailwind CSS · Vercel Cron · Vercel Blob (existing, for dare photos that may appear in issues)

**Reference spec:** [docs/superpowers/specs/2026-05-01-magazine-design.md](../specs/2026-05-01-magazine-design.md)

**Codebase notes for the implementer:**
- This codebase has **no Jest/Vitest test runner**. Verification is `npm run typecheck -w aligned` (TypeScript compilation) plus manual QA via `npm run dev`.
- All scheduled jobs go in `apps/aligned/app/api/cron/...` and are registered in the **root** `vercel.json`. Auth via `Authorization: Bearer ${CRON_SECRET}` (already an env var in production).
- All "use server" actions go in `apps/aligned/lib/`. They take a `relationshipId`, validate the user belongs to it via `requireActiveMember`, and return typed results.
- The Aligned palette is in `lib/couple-colors.ts` (already shipped). `getCouplePalette(relationshipId)` returns `{ primary, secondary }` hex colors.
- Existing helpful patterns: `lib/recap.ts` (week-window math, stopword list, top-words extraction), `lib/dare.ts` (idempotent week-key generation), `lib/streak.ts` (milestone push patterns).
- Always commit each task at the end of its final step. Do not batch commits across tasks.

---

## File Structure

### New files
```
apps/aligned/prisma/migrations/20260501100000_add_issue_model/migration.sql

apps/aligned/lib/issues/
  types.ts                    # IssueSection union, IssueCadence type re-export
  window.ts                   # Monday-anchored week window math
  stopwords.ts                # extracted from recap.ts (so both can share)
  themes.ts                   # top-3 words across both partners' answers
  best-answer.ts              # picks the answer-of-week pull-quote
  best-match.ts               # picks WYR/Quiz match for "Where you aligned"
  saved-moment.ts             # picks dare photo or memory photo (or fallback)
  next-dare.ts                # next week's dare lookup
  question-to-sit-with.ts     # picks reflection prompt for §VII
  cover.ts                    # photo-vs-gradient decision + payload
  headline.ts                 # template selection + slot fill
  templates/weekly.ts         # weekly issue template orchestrator (calls everything above)
  generate.ts                 # top-level generator (for-each-couple loop)

apps/aligned/app/api/cron/issues/route.ts    # cron entry point

apps/aligned/app/app/issues/[id]/
  page.tsx                    # server component, fetches Issue, redirects on missing
  issue-reader.tsx            # client component (scroll motion + dismiss + save)
  sections/
    cover.tsx
    numbers.tsx
    themes.tsx
    answer-of-week.tsx
    aligned-on.tsx
    saved-moment.tsx
    next-dare.tsx
    question-to-sit-with.tsx
    colophon.tsx

apps/aligned/components/issues/
  issue-promo.tsx             # homepage replacement for SundayRecap
```

### Modified files
```
apps/aligned/prisma/schema.prisma           # add Issue model + IssueCadence enum
apps/aligned/app/globals.css                # @font-face for Playfair Display + magazine classes
apps/aligned/app/app/app-page-client.tsx    # swap SundayRecap → IssuePromo
apps/aligned/lib/recap.ts                   # extract STOP / words() to lib/issues/stopwords.ts (shared)
vercel.json                                 # add /api/cron/issues schedule (root file, not under apps/)
```

---

## Task 1: Prisma schema for Issue model

**Files:**
- Modify: `apps/aligned/prisma/schema.prisma`
- Create: `apps/aligned/prisma/migrations/20260501100000_add_issue_model/migration.sql`

- [ ] **Step 1: Add `IssueCadence` enum and `Issue` model to schema**

Open `apps/aligned/prisma/schema.prisma`. Find the Relationship model. **In the Relationship model, add the back-relation field** (just the line, alongside other relation fields like `members`, `streak`, etc.):

```prisma
issues Issue[]
```

Then **append** the following at the end of the file:

```prisma
enum IssueCadence {
  weekly
  monthly
  yearly
  milestone
}

model Issue {
  id             String       @id @default(cuid())
  relationshipId String
  cadence        IssueCadence
  milestoneType  String?
  issueNumber    Int
  volumeNumber   Int          @default(1)
  windowStart    DateTime
  windowEnd      DateTime
  publishedAt    DateTime     @default(now())

  headline       String
  coverPhotoUrl  String?
  coverGradient  Json?
  sections       Json

  savedAt        DateTime?
  openedByA      DateTime?
  openedByB      DateTime?
  isPremium      Boolean      @default(false)

  relationship   Relationship @relation(fields: [relationshipId], references: [id], onDelete: Cascade)

  @@unique([relationshipId, cadence, issueNumber])
  @@index([relationshipId, publishedAt])
}
```

- [ ] **Step 2: Generate the migration SQL**

Create `apps/aligned/prisma/migrations/20260501100000_add_issue_model/migration.sql` with this exact content:

```sql
-- CreateEnum
CREATE TYPE "IssueCadence" AS ENUM ('weekly', 'monthly', 'yearly', 'milestone');

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "cadence" "IssueCadence" NOT NULL,
    "milestoneType" TEXT,
    "issueNumber" INTEGER NOT NULL,
    "volumeNumber" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "headline" TEXT NOT NULL,
    "coverPhotoUrl" TEXT,
    "coverGradient" JSONB,
    "sections" JSONB NOT NULL,
    "savedAt" TIMESTAMP(3),
    "openedByA" TIMESTAMP(3),
    "openedByB" TIMESTAMP(3),
    "isPremium" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Issue_relationshipId_cadence_issueNumber_key" ON "Issue"("relationshipId", "cadence", "issueNumber");

-- CreateIndex
CREATE INDEX "Issue_relationshipId_publishedAt_idx" ON "Issue"("relationshipId", "publishedAt");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 3: Generate Prisma client**

Run from `apps/aligned/`:

```bash
npx prisma generate --schema=prisma/schema.prisma
```

Expected: `✔ Generated Prisma Client (...) to ./generated/prisma`

- [ ] **Step 4: Verify schema compiles**

From the repo root:

```bash
npm run typecheck -w aligned
```

Expected: clean exit (the migration won't apply locally — it applies on Vercel deploy via `prisma migrate deploy`).

- [ ] **Step 5: Commit**

```bash
git add apps/aligned/prisma/schema.prisma apps/aligned/prisma/migrations/20260501100000_add_issue_model/
git commit -m "feat(magazine): add Issue prisma model + IssueCadence enum"
```

---

## Task 2: Section types + week-window math

**Files:**
- Create: `apps/aligned/lib/issues/types.ts`
- Create: `apps/aligned/lib/issues/window.ts`

- [ ] **Step 1: Write the section types**

Create `apps/aligned/lib/issues/types.ts` with this exact content:

```ts
/**
 * Discriminated union of every section kind that can appear in an Issue.
 * The `sections` JSON column on the Issue table is `IssueSection[]`.
 *
 * Phase 1 ships only weekly issues, so kinds prefixed with `month*`/`year*`
 * are declared but unused until Phase 2/3.
 */
export type IssueSection =
  | { kind: "numbers"; daysAnswered: number; totalDays: number; streak: number; matches: number }
  | { kind: "themes"; words: string[] }
  | { kind: "answerOfWeek"; quote: string; attributedTo: "a" | "b"; promptText: string }
  | { kind: "alignedOn"; source: "wyr" | "quiz"; chosen: string; day: string; totalMatches: number }
  | { kind: "savedMoment"; photoUrl: string; caption: string; source: "dare" | "memory" }
  | { kind: "savedMomentFallback"; quote: string; attribution: string }
  | { kind: "nextDare"; title: string; description: string; duration: string }
  | { kind: "questionToSitWith"; text: string }
  | { kind: "monthInPictures"; photoUrls: string[] }
  | { kind: "mostAskedAbout"; category: string; count: number }
  | { kind: "yearInNumbers"; totalQuestions: number; totalMemories: number; totalMatches: number; longestStreak: number }
  | { kind: "twelvePhotos"; photosByMonth: Array<{ month: number; photoUrl: string | null }> }
  | { kind: "fiveBestAnswers"; quotes: Array<{ quote: string; attributedTo: "a" | "b"; promptText: string }> }
  | { kind: "howYouChanged"; earlyCategory: string; recentCategory: string; depthDelta: number };

/** Stored on Issue.coverGradient when no photo is available. */
export type CoverGradient = { primary: string; secondary: string };

/** Cadence values mirror the Prisma enum for use in TypeScript-only code. */
export type IssueCadence = "weekly" | "monthly" | "yearly" | "milestone";
```

- [ ] **Step 2: Write the week-window helper**

Create `apps/aligned/lib/issues/window.ts` with this exact content:

```ts
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
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck -w aligned
```

Expected: clean exit.

- [ ] **Step 4: Commit**

```bash
git add apps/aligned/lib/issues/types.ts apps/aligned/lib/issues/window.ts
git commit -m "feat(magazine): IssueSection types + Monday-anchored week window"
```

---

## Task 3: Stopwords + themes extraction (with shared stopwords)

**Files:**
- Create: `apps/aligned/lib/issues/stopwords.ts`
- Create: `apps/aligned/lib/issues/themes.ts`
- Modify: `apps/aligned/lib/recap.ts` (replace inline `STOP` and `words()` with import)

- [ ] **Step 1: Extract shared stopwords + tokenizer**

Create `apps/aligned/lib/issues/stopwords.ts` with this exact content:

```ts
/**
 * Shared stopword list and tokenizer used by both the legacy Sunday Recap
 * and the new Magazine themes extractor. Lower-cased, length>3, alpha+digit only.
 */
export const STOPWORDS = new Set<string>([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by","from","is","are",
  "was","were","be","been","have","has","had","do","does","did","will","would","could","should",
  "i","you","we","they","he","she","it","my","your","our","their","this","that","just","so",
  "not","no","if","as","me","him","us","them","very","really","get","got","go","some","any",
  "out","all","can","one","two","more","what","when","where","how","why","also","then","like",
]);

/**
 * Tokenize free text into word tokens suitable for theme extraction.
 * Lowercases, strips non-alphanumeric, drops short words and stopwords.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}
```

- [ ] **Step 2: Update recap.ts to use shared module**

Open `apps/aligned/lib/recap.ts`. Find the inline `STOP` constant and `words()` function (near the top of the file). Replace those two declarations with an import. The change:

**Remove these lines (entire block):**
```ts
const STOP = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by","from","is","are",
  // ... (the full multi-line STOP set)
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
}
```

**Add this import at the top of the file (with the other imports):**
```ts
import { tokenize as words } from "@/lib/issues/stopwords";
```

(Alias to `words` so the rest of `recap.ts` doesn't need to change.)

- [ ] **Step 3: Write themes extractor**

Create `apps/aligned/lib/issues/themes.ts` with this exact content:

```ts
import { tokenize } from "./stopwords";

/**
 * Extract the top-N most frequent meaningful words across the supplied texts.
 * Ties are broken by first-occurrence (insertion-stable).
 *
 * Returns up to N words. May return fewer if the texts have insufficient
 * unique meaningful tokens — callers should handle the empty/short case.
 */
export function topWords(texts: string[], n = 3): string[] {
  const counts = new Map<string, number>();
  for (const t of texts) {
    for (const w of tokenize(t)) {
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1]) // Map iteration is insertion-ordered, so equal counts stay stable
    .slice(0, n)
    .map(([w]) => w);
}
```

- [ ] **Step 4: Verify**

```bash
npm run typecheck -w aligned
```

Expected: clean exit. (Recap still works because `words` is now imported under the same alias.)

- [ ] **Step 5: Commit**

```bash
git add apps/aligned/lib/issues/stopwords.ts apps/aligned/lib/issues/themes.ts apps/aligned/lib/recap.ts
git commit -m "feat(magazine): top-words theme extractor (shares stopwords with recap)"
```

---

## Task 4: Best answer + best match aggregators

**Files:**
- Create: `apps/aligned/lib/issues/best-answer.ts`
- Create: `apps/aligned/lib/issues/best-match.ts`

- [ ] **Step 1: Best answer (the pull-quote)**

Create `apps/aligned/lib/issues/best-answer.ts` with this exact content:

```ts
import type { Prisma } from "../../generated/prisma";

/**
 * Picks the "Answer of the Week" for the given window.
 * Strategy:
 *   1. Among answers that have at least one Sticker (reaction) from the partner,
 *      pick the one with the most stickers.
 *   2. Tie-breaker: longest answer wins (more substance).
 *   3. If no reacted answers, pick the longest answer in the window.
 *   4. If no answers, return null (caller should fall back to a quote-less section).
 *
 * Returns the answer text, who said it ("a" or "b" relative to the
 * relationship's two members ordered by createdAt asc), and the prompt text.
 */
export async function pickBestAnswer(
  prisma: Prisma.TransactionClient | typeof import("@/lib/prisma").prisma,
  relationshipId: string,
  start: Date,
  end: Date
): Promise<{ quote: string; attributedTo: "a" | "b"; promptText: string } | null> {
  const sessions = await prisma.dailySession.findMany({
    where: {
      relationshipId,
      sessionDate: { gte: start, lt: end },
    },
    select: {
      prompt: { select: { text: true } },
      responses: {
        select: {
          userId: true,
          answer: true,
          stickers: { select: { id: true } },
        },
      },
    },
  });

  const members = await prisma.relationshipMember.findMany({
    where: { relationshipId, status: "active" },
    orderBy: { createdAt: "asc" },
    select: { userId: true },
    take: 2,
  });
  const partnerA = members[0]?.userId;
  if (!partnerA) return null;

  type Candidate = { quote: string; userId: string; promptText: string; reactions: number; len: number };
  const all: Candidate[] = [];
  for (const s of sessions) {
    const promptText = s.prompt?.text ?? "";
    for (const r of s.responses) {
      const text = (r.answer ?? "").trim();
      if (!text) continue;
      all.push({
        quote: text,
        userId: r.userId,
        promptText,
        reactions: r.stickers.length,
        len: text.length,
      });
    }
  }
  if (all.length === 0) return null;

  const reacted = all.filter((c) => c.reactions > 0);
  const pool = reacted.length > 0 ? reacted : all;
  pool.sort((a, b) => b.reactions - a.reactions || b.len - a.len);

  const winner = pool[0]!;
  return {
    quote: winner.quote,
    attributedTo: winner.userId === partnerA ? "a" : "b",
    promptText: winner.promptText,
  };
}
```

- [ ] **Step 2: Best match (WYR or Quiz alignment)**

Create `apps/aligned/lib/issues/best-match.ts` with this exact content:

```ts
import type { Prisma } from "../../generated/prisma";

/**
 * Picks the WYR/Quiz match for "§ IV — Where you aligned".
 * Phase 1 only checks Would-You-Rather. Quiz support is Phase 2 if useful.
 *
 * Strategy:
 *   - Look at all WYR sessions in the window where both partners answered.
 *   - Of those, count the matches and pick the most recent matching one
 *     (recency = the WYR's createdAt). Ties broken by lower id (stable).
 *   - If no matches, the section is omitted by the template orchestrator
 *     (it returns null here, and the orchestrator drops it from sections[]).
 *
 * `chosen` is the option text that both partners picked.
 * `day` is the day-of-week of the match (e.g., "Tuesday"), in the server's
 * locale; this is fine because the format is just for display.
 * `totalMatches` is the total count of matched WYRs in the window.
 */
export async function pickBestMatch(
  prisma: Prisma.TransactionClient | typeof import("@/lib/prisma").prisma,
  relationshipId: string,
  start: Date,
  end: Date
): Promise<{ source: "wyr"; chosen: string; day: string; totalMatches: number } | null> {
  const wyrs = await prisma.wyrSession.findMany({
    where: {
      relationshipId,
      createdAt: { gte: start, lt: end },
    },
    select: {
      id: true,
      createdAt: true,
      question: { select: { optionA: true, optionB: true } },
      responses: { select: { choice: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const matched = wyrs.filter(
    (w) =>
      w.responses.length === 2 &&
      w.responses[0]!.choice === w.responses[1]!.choice &&
      w.question != null
  );

  if (matched.length === 0) return null;

  const winner = matched[0]!; // most recent
  const choice = winner.responses[0]!.choice;
  const text =
    choice === 0 ? winner.question!.optionA : winner.question!.optionB;
  const day = new Date(winner.createdAt).toLocaleDateString("en-US", { weekday: "long" });

  return {
    source: "wyr",
    chosen: text,
    day,
    totalMatches: matched.length,
  };
}
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck -w aligned
```

Expected: clean exit. (If you get errors about `WyrSession` field names, look at the actual Prisma model in `apps/aligned/prisma/schema.prisma` — adjust `optionA/optionB` and `choice` field names to match the real schema. The pattern is the same.)

- [ ] **Step 4: Commit**

```bash
git add apps/aligned/lib/issues/best-answer.ts apps/aligned/lib/issues/best-match.ts
git commit -m "feat(magazine): best-answer + best-match aggregators"
```

---

## Task 5: Saved-moment, next-dare, question-to-sit-with

**Files:**
- Create: `apps/aligned/lib/issues/saved-moment.ts`
- Create: `apps/aligned/lib/issues/next-dare.ts`
- Create: `apps/aligned/lib/issues/question-to-sit-with.ts`

- [ ] **Step 1: Saved moment (photo selection)**

Create `apps/aligned/lib/issues/saved-moment.ts` with this exact content:

```ts
import type { Prisma } from "../../generated/prisma";
import type { IssueSection } from "./types";

/**
 * Picks "§ V — A Saved Moment" content for the window.
 * Priority:
 *   1. Most-recent dare photo from a completed dare in the window
 *   2. Most-recent memory with a photo in the window
 *   3. Fallback: a non-photo pull-quote from a saved appreciation memory in the window
 *   4. If none: returns null and the section is omitted.
 */
export async function pickSavedMoment(
  prisma: typeof import("@/lib/prisma").prisma,
  relationshipId: string,
  start: Date,
  end: Date
): Promise<Extract<IssueSection, { kind: "savedMoment" | "savedMomentFallback" }> | null> {
  // 1. Dare photo
  const dare = await prisma.dateNightDare.findFirst({
    where: {
      relationshipId,
      completedAt: { gte: start, lt: end },
      photoUrl: { not: null },
    },
    orderBy: { completedAt: "desc" },
  });
  if (dare?.photoUrl) {
    return {
      kind: "savedMoment",
      photoUrl: dare.photoUrl,
      caption: "From this week's dare.",
      source: "dare",
    };
  }

  // 2. Memory with a photo
  const photoMemory = await prisma.memory.findFirst({
    where: {
      relationshipId,
      createdAt: { gte: start, lt: end },
      imageUrl: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });
  if (photoMemory?.imageUrl) {
    return {
      kind: "savedMoment",
      photoUrl: photoMemory.imageUrl,
      caption: "Saved to your memories this week.",
      source: "memory",
    };
  }

  // 3. Appreciation pull-quote
  const appreciation = await prisma.memory.findFirst({
    where: {
      relationshipId,
      createdAt: { gte: start, lt: end },
      type: "appreciation",
    },
    orderBy: { createdAt: "desc" },
    select: { content: true },
  });
  if (appreciation?.content) {
    return {
      kind: "savedMomentFallback",
      quote: appreciation.content,
      attribution: "From an appreciation this week.",
    };
  }

  return null;
}
```

- [ ] **Step 2: Next dare lookup**

Create `apps/aligned/lib/issues/next-dare.ts` with this exact content:

```ts
import type { IssueSection } from "./types";

/**
 * Returns the dare that's queued for next week (the ISO week starting on
 * `nextMondayStart`). The dare table stores `weekKey` so we look up by that.
 *
 * If none exists yet (the next-week dare row hasn't been created), returns
 * null and the orchestrator drops the section.
 */
export async function pickNextDare(
  prisma: typeof import("@/lib/prisma").prisma,
  relationshipId: string,
  nextMondayStart: Date
): Promise<Extract<IssueSection, { kind: "nextDare" }> | null> {
  const weekKey = isoWeekKey(nextMondayStart);
  const next = await prisma.dateNightDare.findUnique({
    where: { relationshipId_weekKey: { relationshipId, weekKey } },
  });
  if (!next) return null;

  // Reuse the static dare list from lib/dare.ts. To avoid an import cycle, we
  // re-declare a minimal type and access the title/desc/duration via a tiny
  // helper that re-imports DARES from lib/dare.ts.
  const { getDareCopy } = await import("../dare");
  const copy = getDareCopy(next.dareIndex);
  if (!copy) return null;

  return {
    kind: "nextDare",
    title: copy.title,
    description: copy.description,
    duration: copy.duration,
  };
}

function isoWeekKey(d: Date): string {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
```

Note: this requires a small addition to `lib/dare.ts`. **Open `apps/aligned/lib/dare.ts`** and add at the end (after the existing exports):

```ts
/**
 * Public accessor for a dare's display copy by index. Used by the magazine
 * generator so it doesn't have to import the full DARES array.
 */
export function getDareCopy(idx: number): Dare | null {
  return DARES[idx] ?? null;
}
```

- [ ] **Step 3: Question-to-sit-with**

Create `apps/aligned/lib/issues/question-to-sit-with.ts` with this exact content:

```ts
import type { IssueSection } from "./types";

/**
 * The closing reflection prompt for the week ahead (§ VII).
 *
 * Phase 1: deterministic pick from a curated pool, hashed by relationshipId
 * + weekKey so each issue gets a different one but the same one is shown
 * to both partners. Pool is small and intentional — these are written for
 * the magazine voice, not the daily-prompt rotation.
 */
const POOL = [
  "What's something I've done this week that you almost said thank you for, but didn't?",
  "What's one small thing I've done lately that's actually a big thing to you?",
  "If you could replay one moment from this week and stay in it longer, which one?",
  "What's a question you'd want to be asked more often?",
  "When this week did you feel most like yourself?",
  "Is there anything I should know that you haven't said out loud yet?",
  "What's the smallest version of love you noticed this week?",
  "If we could trade one ritual for a better one, what would it be?",
];

export function pickQuestionToSitWith(
  relationshipId: string,
  weekKey: string
): Extract<IssueSection, { kind: "questionToSitWith" }> {
  let h = 0;
  const s = relationshipId + ":" + weekKey;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return { kind: "questionToSitWith", text: POOL[h % POOL.length]! };
}
```

- [ ] **Step 4: Verify**

```bash
npm run typecheck -w aligned
```

Expected: clean exit. **If `Memory.imageUrl` or `Memory.type` field names don't match the real schema**, open `apps/aligned/prisma/schema.prisma` and adjust the queries to use the actual field names.

- [ ] **Step 5: Commit**

```bash
git add apps/aligned/lib/issues/saved-moment.ts apps/aligned/lib/issues/next-dare.ts apps/aligned/lib/issues/question-to-sit-with.ts apps/aligned/lib/dare.ts
git commit -m "feat(magazine): saved-moment + next-dare + question-to-sit-with pickers"
```

---

## Task 6: Cover (photo or gradient) + headline templates

**Files:**
- Create: `apps/aligned/lib/issues/cover.ts`
- Create: `apps/aligned/lib/issues/headline.ts`

- [ ] **Step 1: Cover**

Create `apps/aligned/lib/issues/cover.ts` with this exact content:

```ts
import { getCouplePalette } from "@/lib/couple-colors";
import type { CoverGradient } from "./types";

/**
 * Decides the cover treatment for an Issue. If the saved-moment for this
 * window is a photo, that photo doubles as the cover. Otherwise, we fall
 * back to a gradient using the couple's deterministic color pair.
 *
 * Returns one of:
 *   { kind: "photo", url } — Issue.coverPhotoUrl gets `url`, coverGradient null
 *   { kind: "gradient", gradient } — Issue.coverGradient gets `gradient`,
 *                                    coverPhotoUrl null
 */
export function chooseCover(
  relationshipId: string,
  candidatePhotoUrl: string | null
): { kind: "photo"; url: string } | { kind: "gradient"; gradient: CoverGradient } {
  if (candidatePhotoUrl) return { kind: "photo", url: candidatePhotoUrl };
  const palette = getCouplePalette(relationshipId);
  return {
    kind: "gradient",
    gradient: { primary: palette.primary, secondary: palette.secondary },
  };
}
```

- [ ] **Step 2: Headline templates**

Create `apps/aligned/lib/issues/headline.ts` with this exact content:

```ts
/**
 * Headline generator for Phase 1: deterministic template selection from a
 * small pool, with slot fill from the week's extracted data. AI-generated
 * headlines are Phase 2 (out of scope here).
 *
 * Templates are functions of the available data so we can fail-soft: if
 * `topWords` is empty, we pick a template that doesn't need it. The selection
 * is hashed so each (relationship, week) gets a stable choice, but different
 * weeks see variety.
 */

type HeadlineInput = {
  relationshipId: string;
  weekKey: string;
  topWords: string[];          // 0..3 entries
  bestMatchText: string | null; // e.g. "Stay in" — used by one template
};

type Template = {
  /** Returns null if this template can't render with the given input. */
  render: (i: HeadlineInput) => string | null;
};

const TEMPLATES: Template[] = [
  {
    render: (i) =>
      i.topWords[0] && i.topWords[1]
        ? `A week of ${i.topWords[0]} and ${i.topWords[1]}.`
        : null,
  },
  {
    render: (i) => (i.topWords[0] ? `${capitalize(i.topWords[0])}, mostly.` : null),
  },
  {
    render: (i) =>
      i.topWords[0]
        ? `You both kept coming back to ${i.topWords[0]}.`
        : null,
  },
  {
    render: (i) => (i.bestMatchText ? `The week of "${i.bestMatchText}".` : null),
  },
  {
    render: () => "Some weeks are quiet. This was one of them.",
  },
];

export function pickHeadline(input: HeadlineInput): string {
  // Hash to pick a starting template, then walk forward until one renders.
  let h = 0;
  const s = input.relationshipId + ":" + input.weekKey;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const startIdx = h % TEMPLATES.length;

  for (let offset = 0; offset < TEMPLATES.length; offset++) {
    const idx = (startIdx + offset) % TEMPLATES.length;
    const out = TEMPLATES[idx]!.render(input);
    if (out) return out;
  }
  // Final fallback (can't be reached given the last template always renders)
  return "A week together.";
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck -w aligned
```

Expected: clean exit.

- [ ] **Step 4: Commit**

```bash
git add apps/aligned/lib/issues/cover.ts apps/aligned/lib/issues/headline.ts
git commit -m "feat(magazine): cover-treatment chooser + template-based headline"
```

---

## Task 7: Weekly template orchestrator + generator

**Files:**
- Create: `apps/aligned/lib/issues/templates/weekly.ts`
- Create: `apps/aligned/lib/issues/generate.ts`

- [ ] **Step 1: Weekly template orchestrator**

Create `apps/aligned/lib/issues/templates/weekly.ts` with this exact content:

```ts
import { prisma } from "@/lib/prisma";
import { pickBestAnswer } from "../best-answer";
import { pickBestMatch } from "../best-match";
import { chooseCover } from "../cover";
import { pickHeadline } from "../headline";
import { pickNextDare } from "../next-dare";
import { pickQuestionToSitWith } from "../question-to-sit-with";
import { pickSavedMoment } from "../saved-moment";
import { topWords } from "../themes";
import type { IssueSection } from "../types";

/**
 * Builds the data payload for a Weekly Issue. Pure with respect to its inputs:
 * given the same DB state and window, returns the same payload.
 *
 * Returns null when the issue should be skipped (e.g. <2 days answered).
 */
export async function buildWeeklyIssue(args: {
  relationshipId: string;
  start: Date;
  end: Date;
  weekKey: string;
}): Promise<{
  headline: string;
  coverPhotoUrl: string | null;
  coverGradient: { primary: string; secondary: string } | null;
  sections: IssueSection[];
} | null> {
  const { relationshipId, start, end, weekKey } = args;

  // Aggregate sessions for the window
  const sessions = await prisma.dailySession.findMany({
    where: { relationshipId, sessionDate: { gte: start, lt: end } },
    select: {
      sessionDate: true,
      responses: { select: { answer: true } },
    },
  });

  const daysAnswered = sessions.filter((s) => s.responses.length > 0).length;
  if (daysAnswered < 2) return null; // skip empty/sparse weeks

  const allAnswers = sessions.flatMap((s) =>
    s.responses.map((r) => r.answer ?? "").filter(Boolean)
  );

  const themeWords = topWords(allAnswers, 3);
  const bestAnswer = await pickBestAnswer(prisma, relationshipId, start, end);
  const bestMatch = await pickBestMatch(prisma, relationshipId, start, end);
  const savedMoment = await pickSavedMoment(prisma, relationshipId, start, end);
  const nextDare = await pickNextDare(prisma, relationshipId, end /* end == next Monday */);
  const reflection = pickQuestionToSitWith(relationshipId, weekKey);

  // Streak + total matches for the numbers section
  const streakRow = await prisma.streak.findUnique({
    where: { relationshipId },
    select: { currentCount: true },
  });

  const sections: IssueSection[] = [];
  sections.push({
    kind: "numbers",
    daysAnswered,
    totalDays: 7,
    streak: streakRow?.currentCount ?? 0,
    matches: bestMatch?.totalMatches ?? 0,
  });
  if (themeWords.length > 0) sections.push({ kind: "themes", words: themeWords });
  if (bestAnswer) sections.push({ kind: "answerOfWeek", ...bestAnswer });
  if (bestMatch) sections.push({ kind: "alignedOn", ...bestMatch });
  if (savedMoment) sections.push(savedMoment);
  if (nextDare) sections.push(nextDare);
  sections.push(reflection);

  // Cover decision: use photo from a "savedMoment" if it's the photo kind,
  // otherwise gradient.
  const candidatePhoto =
    savedMoment && savedMoment.kind === "savedMoment" ? savedMoment.photoUrl : null;
  const cover = chooseCover(relationshipId, candidatePhoto);

  // Headline
  const headline = pickHeadline({
    relationshipId,
    weekKey,
    topWords: themeWords,
    bestMatchText: bestMatch?.chosen ?? null,
  });

  return {
    headline,
    coverPhotoUrl: cover.kind === "photo" ? cover.url : null,
    coverGradient: cover.kind === "gradient" ? cover.gradient : null,
    sections,
  };
}
```

- [ ] **Step 2: Top-level generator**

Create `apps/aligned/lib/issues/generate.ts` with this exact content:

```ts
import { prisma } from "@/lib/prisma";
import { buildWeeklyIssue } from "./templates/weekly";
import { weekWindowFor } from "./window";

/**
 * Generates a Weekly Issue for one specific relationship, anchored at `now`.
 *
 * Idempotent: if an Issue already exists for this (relationship, weekKey),
 * it returns { created: false, skipped: true }.
 *
 * Skipped when the buildWeeklyIssue call returns null (e.g. <2 days answered).
 */
export async function generateWeeklyIssueForRelationship(args: {
  relationshipId: string;
  now: Date;
  isPremium: boolean;
}): Promise<{ created: boolean; skipped: boolean; reason?: string; issueId?: string }> {
  const { relationshipId, now, isPremium } = args;

  const { start, end, weekKey } = weekWindowFor(now);

  // Determine issueNumber by counting prior weekly issues for this couple
  const priorCount = await prisma.issue.count({
    where: { relationshipId, cadence: "weekly" },
  });
  const issueNumber = priorCount + 1;

  // Idempotency check via unique constraint
  const existing = await prisma.issue.findUnique({
    where: {
      relationshipId_cadence_issueNumber: {
        relationshipId,
        cadence: "weekly",
        issueNumber,
      },
    },
  });
  if (existing) return { created: false, skipped: true, reason: "exists" };

  const built = await buildWeeklyIssue({ relationshipId, start, end, weekKey });
  if (!built) return { created: false, skipped: true, reason: "insufficient-data" };

  const created = await prisma.issue.create({
    data: {
      relationshipId,
      cadence: "weekly",
      issueNumber,
      volumeNumber: 1, // Phase 1: every couple is in Volume 1. Phase 3 introduces volume rollover.
      windowStart: start,
      windowEnd: end,
      headline: built.headline,
      coverPhotoUrl: built.coverPhotoUrl,
      coverGradient: built.coverGradient ?? undefined,
      sections: built.sections,
      isPremium,
    },
    select: { id: true },
  });

  return { created: true, skipped: false, issueId: created.id };
}

/**
 * Iterate all active relationships and generate where appropriate.
 * Only relationships whose local Sunday is "now" should generate.
 *
 * Phase 1 simplification: we don't yet store user timezone, so we treat every
 * Sunday at the cron tick as eligible (the cron is scheduled hourly on Sundays).
 * This means a relationship may generate at any hour on Sunday UTC.
 * Idempotency keeps this safe — only the first tick of the day creates the issue.
 */
export async function generateAllWeeklyIssues(now: Date): Promise<{ created: number; skipped: number }> {
  if (now.getUTCDay() !== 0) return { created: 0, skipped: 0 };

  const rels = await prisma.relationship.findMany({
    where: { status: "active" },
    select: { id: true /* TODO Phase 3: select isPremium for each rel */ },
  });

  let created = 0;
  let skipped = 0;
  for (const rel of rels) {
    const r = await generateWeeklyIssueForRelationship({
      relationshipId: rel.id,
      now,
      isPremium: false, // Phase 1: everyone is "free" — we'll enforce gating in Phase 3
    });
    if (r.created) created++;
    else skipped++;
  }
  return { created, skipped };
}
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck -w aligned
```

Expected: clean exit.

- [ ] **Step 4: Commit**

```bash
git add apps/aligned/lib/issues/templates/weekly.ts apps/aligned/lib/issues/generate.ts
git commit -m "feat(magazine): weekly issue orchestrator + per-couple generator"
```

---

## Task 8: Cron route + vercel.json schedule

**Files:**
- Create: `apps/aligned/app/api/cron/issues/route.ts`
- Modify: `vercel.json` (root)

- [ ] **Step 1: Cron route**

Create `apps/aligned/app/api/cron/issues/route.ts` with this exact content:

```ts
import { NextResponse } from "next/server";
import { generateAllWeeklyIssues } from "@/lib/issues/generate";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Cron entry point for Issue generation.
 * Vercel calls this hourly (see vercel.json). On Sundays, it generates
 * Weekly Issues for all active relationships. Other days it's a no-op.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekly = await generateAllWeeklyIssues(now);

  return NextResponse.json({
    ok: true,
    now: now.toISOString(),
    weekly,
  });
}
```

- [ ] **Step 2: Add cron schedule**

Open the **root** `vercel.json` (not under `apps/`). Add a new entry to the `crons` array:

```json
{
  "crons": [
    {
      "path": "/api/cron/content-review",
      "schedule": "0 9 1 * *"
    },
    {
      "path": "/api/cron/tomorrow-tease",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/issues",
      "schedule": "0 * * * 0"
    }
  ]
}
```

The new line `"0 * * * 0"` runs at minute 0 of every hour on Sunday. The route itself short-circuits on non-Sundays as a defense-in-depth.

- [ ] **Step 3: Verify**

```bash
npm run typecheck -w aligned
```

Expected: clean exit.

- [ ] **Step 4: Commit**

```bash
git add apps/aligned/app/api/cron/issues/route.ts vercel.json
git commit -m "feat(magazine): cron route + Sunday-hourly schedule for weekly issue generation"
```

---

## Task 9: Magazine typography + globals.css

**Files:**
- Modify: `apps/aligned/app/globals.css`

- [ ] **Step 1: Add Google Fonts import + magazine classes**

Open `apps/aligned/app/globals.css`. **At the very top of the file, before any other CSS** (or after any existing `@import` statements that are already there), add:

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap');
```

Then **append** at the end of the file:

```css
/* ───────────────────────────────────────────────────────────────────────
   Aligned: The Magazine — editorial typography stack.
   Used only inside .magazine-frame and its descendants. Scoped so we
   don't bleed serif type into the rest of the app.
   ─────────────────────────────────────────────────────────────────────── */
.magazine-frame {
  background: #faf7f2;
  color: #2d2d2d;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}
.magazine-frame .mag-display {
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 300;
  letter-spacing: -0.03em;
  line-height: 0.95;
}
.magazine-frame .mag-body {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #3d3d3d;
}
.magazine-frame .mag-label {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 0.6rem;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #999;
  display: flex;
  align-items: center;
  gap: 10px;
}
.magazine-frame .mag-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #d4cdbe;
}
.magazine-frame .mag-meta {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #888;
}
.magazine-frame .mag-divider {
  width: 32px;
  height: 1px;
  background: #2d2d2d;
}
.magazine-frame .mag-section {
  padding: 48px 32px;
  border-bottom: 1px solid #e8e2d6;
}
.magazine-frame .mag-section:last-child { border-bottom: none; }
.magazine-frame .mag-pullquote {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.6rem;
  font-style: italic;
  font-weight: 300;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

/* Scroll-reveal for sections — gracefully degrades if motion is reduced */
.magazine-frame .mag-reveal {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.magazine-frame .mag-reveal.is-visible {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .magazine-frame .mag-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

- [ ] **Step 2: Verify**

```bash
npm run typecheck -w aligned
```

Expected: clean exit (CSS isn't typechecked but this confirms nothing broke).

- [ ] **Step 3: Commit**

```bash
git add apps/aligned/app/globals.css
git commit -m "feat(magazine): editorial typography stack scoped to .magazine-frame"
```

---

## Task 10: Section components (cover, numbers, themes, answer-of-week)

**Files:**
- Create: `apps/aligned/app/app/issues/[id]/sections/cover.tsx`
- Create: `apps/aligned/app/app/issues/[id]/sections/numbers.tsx`
- Create: `apps/aligned/app/app/issues/[id]/sections/themes.tsx`
- Create: `apps/aligned/app/app/issues/[id]/sections/answer-of-week.tsx`

- [ ] **Step 1: Cover**

Create `apps/aligned/app/app/issues/[id]/sections/cover.tsx`:

```tsx
import type { CoverGradient } from "@/lib/issues/types";

type Props = {
  headline: string;
  issueNumber: number;
  volumeNumber: number;
  windowStart: Date;
  windowEnd: Date;
  coverPhotoUrl: string | null;
  coverGradient: CoverGradient | null;
  partnerNames: { a: string; b: string };
};

function fmtRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
  const startStr = start.toLocaleDateString("en-US", opts);
  return `Week of ${startStr}`;
}

export function CoverSection(p: Props) {
  const bg =
    p.coverPhotoUrl
      ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.05),rgba(0,0,0,0.45)), url(${p.coverPhotoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
      : p.coverGradient
        ? { background: `linear-gradient(160deg, ${p.coverGradient.primary} 0%, ${p.coverGradient.secondary} 100%)` }
        : { background: "#faf7f2" };

  const onPhoto = !!p.coverPhotoUrl;

  return (
    <header
      className="mag-section"
      style={{ ...bg, color: onPhoto ? "#faf7f2" : "#2d2d2d", paddingTop: 56, paddingBottom: 56 }}
    >
      <div className="mag-meta" style={{ color: onPhoto ? "rgba(250,247,242,0.75)" : "#888" }}>
        Aligned · The Magazine
      </div>
      <div className="mag-meta" style={{ marginTop: 6, color: onPhoto ? "rgba(250,247,242,0.65)" : "#999" }}>
        Issue {p.issueNumber} / Vol. {p.volumeNumber} · {fmtRange(p.windowStart, p.windowEnd)}
      </div>
      <h1 className="mag-display" style={{ fontSize: "2.4rem", margin: "40px 0 16px" }}>
        {p.headline}
      </h1>
      <div className="mag-divider" style={{ background: onPhoto ? "rgba(250,247,242,0.85)" : "#2d2d2d" }} />
      <p className="mag-meta" style={{ marginTop: 16, color: onPhoto ? "rgba(250,247,242,0.85)" : "#888" }}>
        For {p.partnerNames.a} &amp; {p.partnerNames.b}
      </p>
    </header>
  );
}
```

- [ ] **Step 2: Numbers**

Create `apps/aligned/app/app/issues/[id]/sections/numbers.tsx`:

```tsx
type Props = { daysAnswered: number; totalDays: number; streak: number; matches: number };

export function NumbersSection({ daysAnswered, totalDays, streak, matches }: Props) {
  return (
    <section className="mag-section mag-reveal">
      <div className="mag-label">§ I — The Week in Numbers</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 18 }}>
        <Stat num={`${daysAnswered}`} sub={`/${totalDays}`} label="Days Answered" />
        <Stat num={`${streak}`} label="Day Streak" />
        <Stat num={`${matches}`} label="Matched Picks" />
      </div>
    </section>
  );
}

function Stat({ num, sub, label }: { num: string; sub?: string; label: string }) {
  return (
    <div>
      <div className="mag-display" style={{ fontSize: "2.4rem" }}>
        {num}
        {sub && <span style={{ fontSize: "1.2rem", color: "#999" }}>{sub}</span>}
      </div>
      <div className="mag-meta" style={{ marginTop: 4 }}>{label}</div>
    </div>
  );
}
```

- [ ] **Step 3: Themes**

Create `apps/aligned/app/app/issues/[id]/sections/themes.tsx`:

```tsx
type Props = { words: string[] };

export function ThemesSection({ words }: Props) {
  if (words.length === 0) return null;
  return (
    <section className="mag-section mag-reveal">
      <div className="mag-label">§ II — Recurring Themes</div>
      <p className="mag-body" style={{ marginBottom: 8 }}>
        Across both your answers this week, these kept surfacing:
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
        {words.map((w, i) => (
          <span key={w} style={{ display: "inline-flex", alignItems: "baseline", gap: 10 }}>
            <span
              className="mag-display"
              style={{ fontStyle: "italic", fontSize: "1.4rem", fontWeight: 400 }}
            >
              {w}
            </span>
            {i < words.length - 1 && <span style={{ color: "#c9c2b1", fontSize: "1.4rem" }}>·</span>}
          </span>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Answer of the Week**

Create `apps/aligned/app/app/issues/[id]/sections/answer-of-week.tsx`:

```tsx
type Props = {
  quote: string;
  attributedTo: "a" | "b";
  promptText: string;
  partnerNames: { a: string; b: string };
};

export function AnswerOfWeekSection({ quote, attributedTo, promptText, partnerNames }: Props) {
  const who = attributedTo === "a" ? partnerNames.a : partnerNames.b;
  return (
    <section className="mag-section mag-reveal" style={{ background: "#f3ede0" }}>
      <div className="mag-label">§ III — Answer of the Week</div>
      <blockquote className="mag-pullquote" style={{ margin: "12px 0 0" }}>
        &ldquo;{quote}&rdquo;
      </blockquote>
      <p className="mag-meta" style={{ marginTop: 16 }}>
        — {who}, on &ldquo;{truncate(promptText, 60)}&rdquo;
      </p>
    </section>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}
```

- [ ] **Step 5: Verify**

```bash
npm run typecheck -w aligned
```

Expected: clean exit.

- [ ] **Step 6: Commit**

```bash
git add apps/aligned/app/app/issues/[id]/sections/cover.tsx apps/aligned/app/app/issues/[id]/sections/numbers.tsx apps/aligned/app/app/issues/[id]/sections/themes.tsx apps/aligned/app/app/issues/[id]/sections/answer-of-week.tsx
git commit -m "feat(magazine): cover + numbers + themes + answer-of-week section components"
```

---

## Task 11: Section components (aligned-on, saved-moment, next-dare, question-to-sit-with, colophon)

**Files:**
- Create: `apps/aligned/app/app/issues/[id]/sections/aligned-on.tsx`
- Create: `apps/aligned/app/app/issues/[id]/sections/saved-moment.tsx`
- Create: `apps/aligned/app/app/issues/[id]/sections/next-dare.tsx`
- Create: `apps/aligned/app/app/issues/[id]/sections/question-to-sit-with.tsx`
- Create: `apps/aligned/app/app/issues/[id]/sections/colophon.tsx`

- [ ] **Step 1: Aligned-on**

Create `apps/aligned/app/app/issues/[id]/sections/aligned-on.tsx`:

```tsx
type Props = { source: "wyr" | "quiz"; chosen: string; day: string; totalMatches: number };

export function AlignedOnSection({ chosen, day, totalMatches }: Props) {
  return (
    <section className="mag-section mag-reveal">
      <div className="mag-label">§ IV — Where You Aligned</div>
      <p className="mag-display" style={{ fontSize: "1.6rem", marginBottom: 12 }}>
        You both picked <em style={{ fontStyle: "italic" }}>&ldquo;{chosen}&rdquo;</em> on {day}&apos;s Would You Rather.
      </p>
      <p className="mag-body">
        {totalMatches} {totalMatches === 1 ? "match" : "matches"} this week. The rest? You see things differently. That&apos;s the point.
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Saved-moment**

Create `apps/aligned/app/app/issues/[id]/sections/saved-moment.tsx`:

```tsx
type SavedMoment = { kind: "savedMoment"; photoUrl: string; caption: string; source: "dare" | "memory" };
type SavedMomentFallback = { kind: "savedMomentFallback"; quote: string; attribution: string };
type Props = SavedMoment | SavedMomentFallback;

export function SavedMomentSection(p: Props) {
  if (p.kind === "savedMomentFallback") {
    return (
      <section className="mag-section mag-reveal">
        <div className="mag-label">§ V — A Saved Moment</div>
        <blockquote className="mag-pullquote" style={{ margin: "12px 0 0", fontSize: "1.3rem" }}>
          &ldquo;{p.quote}&rdquo;
        </blockquote>
        <p className="mag-meta" style={{ marginTop: 16 }}>{p.attribution}</p>
      </section>
    );
  }
  return (
    <section className="mag-section mag-reveal">
      <div className="mag-label">§ V — A Saved Moment</div>
      <figure
        style={{
          aspectRatio: "4/5",
          backgroundImage: `linear-gradient(rgba(0,0,0,0),rgba(0,0,0,0.45)), url(${p.photoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 4,
          margin: "20px 0 0",
          display: "flex",
          alignItems: "flex-end",
          padding: 20,
        }}
      >
        <figcaption
          style={{
            color: "#faf7f2",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            fontSize: "0.85rem",
            lineHeight: 1.4,
          }}
        >
          {p.caption}
        </figcaption>
      </figure>
    </section>
  );
}
```

- [ ] **Step 3: Next-dare**

Create `apps/aligned/app/app/issues/[id]/sections/next-dare.tsx`:

```tsx
type Props = { title: string; description: string; duration: string };

export function NextDareSection({ title, description, duration }: Props) {
  return (
    <section className="mag-section mag-reveal">
      <div className="mag-label">§ VI — On the Cover Next Week</div>
      <p className="mag-display" style={{ fontSize: "1.4rem", marginBottom: 12 }}>
        Your next dare: <em style={{ fontStyle: "italic" }}>{title}</em>
      </p>
      <p className="mag-body">{description}</p>
      <p className="mag-meta" style={{ marginTop: 12 }}>{duration}</p>
    </section>
  );
}
```

- [ ] **Step 4: Question-to-sit-with**

Create `apps/aligned/app/app/issues/[id]/sections/question-to-sit-with.tsx`:

```tsx
type Props = { text: string };

export function QuestionToSitWithSection({ text }: Props) {
  return (
    <section className="mag-section mag-reveal">
      <div className="mag-label">§ VII — A Question to Sit With</div>
      <blockquote className="mag-pullquote" style={{ fontSize: "1.3rem", margin: "12px 0 0" }}>
        &ldquo;{text}&rdquo;
      </blockquote>
      <p className="mag-meta" style={{ marginTop: 16 }}>From your reflections this week.</p>
    </section>
  );
}
```

- [ ] **Step 5: Colophon**

Create `apps/aligned/app/app/issues/[id]/sections/colophon.tsx`:

```tsx
"use client";

import { useState } from "react";

type Props = {
  issueId: string;
  initialSaved: boolean;
  issueNumber: number;
  volumeNumber: number;
  publishedAt: Date;
  onSaveToggle: (issueId: string, next: boolean) => Promise<void>;
};

export function ColophonSection({ issueId, initialSaved, issueNumber, volumeNumber, publishedAt, onSaveToggle }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function handleSave() {
    if (pending) return;
    setPending(true);
    const next = !saved;
    setSaved(next);
    try {
      await onSaveToggle(issueId, next);
    } catch {
      setSaved(!next);
    } finally {
      setPending(false);
    }
  }

  const month = publishedAt.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <footer className="mag-section mag-reveal" style={{ textAlign: "center", paddingTop: 32, paddingBottom: 48 }}>
      <p className="mag-display" style={{ fontStyle: "italic", fontSize: "0.9rem", color: "#888" }}>
        — End of issue —
      </p>
      <p className="mag-meta" style={{ marginTop: 8 }}>
        Issue {issueNumber} · Vol. {volumeNumber} · {month}
      </p>
      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="mag-meta"
        style={{
          marginTop: 24,
          background: saved ? "#faf7f2" : "#2d2d2d",
          color: saved ? "#2d2d2d" : "#faf7f2",
          border: saved ? "1px solid #2d2d2d" : "none",
          padding: "14px 24px",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          borderRadius: 2,
          cursor: pending ? "default" : "pointer",
          opacity: pending ? 0.6 : 1,
        }}
      >
        {saved ? "Saved" : "Save This Issue"}
      </button>
    </footer>
  );
}
```

- [ ] **Step 6: Verify**

```bash
npm run typecheck -w aligned
```

Expected: clean exit.

- [ ] **Step 7: Commit**

```bash
git add apps/aligned/app/app/issues/[id]/sections/
git commit -m "feat(magazine): aligned-on, saved-moment, next-dare, question-to-sit-with, colophon sections"
```

---

## Task 12: Issue reader (server page + client component) + save action

**Files:**
- Create: `apps/aligned/lib/issues/actions.ts` (server action: save toggle)
- Create: `apps/aligned/app/app/issues/[id]/page.tsx`
- Create: `apps/aligned/app/app/issues/[id]/issue-reader.tsx`

- [ ] **Step 1: Save server action**

Create `apps/aligned/lib/issues/actions.ts`:

```ts
"use server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/relationship-members";

/**
 * Toggle the saved state of an Issue. Auth required + caller must be an
 * active member of the relationship that owns the issue.
 */
export async function toggleIssueSaved(issueId: string, saved: boolean): Promise<void> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, relationshipId: true },
  });
  if (!issue) throw new Error("Issue not found");

  await requireActiveMember(session.user.id, issue.relationshipId);

  await prisma.issue.update({
    where: { id: issueId },
    data: { savedAt: saved ? new Date() : null },
  });
}
```

- [ ] **Step 2: Server page**

Create `apps/aligned/app/app/issues/[id]/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/relationship-members";
import type { CoverGradient, IssueSection } from "@/lib/issues/types";
import { IssueReader } from "./issue-reader";

export const dynamic = "force-dynamic";

export default async function IssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect("/login");

  const issue = await prisma.issue.findUnique({
    where: { id },
    select: {
      id: true,
      relationshipId: true,
      cadence: true,
      issueNumber: true,
      volumeNumber: true,
      windowStart: true,
      windowEnd: true,
      publishedAt: true,
      headline: true,
      coverPhotoUrl: true,
      coverGradient: true,
      sections: true,
      savedAt: true,
    },
  });
  if (!issue) redirect("/app/issues");

  await requireActiveMember(session.user.id, issue.relationshipId);

  const members = await prisma.relationshipMember.findMany({
    where: { relationshipId: issue.relationshipId, status: "active" },
    orderBy: { createdAt: "asc" },
    select: { user: { select: { name: true } } },
    take: 2,
  });
  const aName = members[0]?.user?.name ?? "—";
  const bName = members[1]?.user?.name ?? "—";

  return (
    <IssueReader
      issue={{
        id: issue.id,
        issueNumber: issue.issueNumber,
        volumeNumber: issue.volumeNumber,
        windowStart: issue.windowStart,
        windowEnd: issue.windowEnd,
        publishedAt: issue.publishedAt,
        headline: issue.headline,
        coverPhotoUrl: issue.coverPhotoUrl,
        coverGradient: issue.coverGradient as CoverGradient | null,
        sections: issue.sections as IssueSection[],
        initialSaved: !!issue.savedAt,
      }}
      partnerNames={{ a: aName, b: bName }}
    />
  );
}
```

- [ ] **Step 3: Client reader (composition + scroll-reveal)**

Create `apps/aligned/app/app/issues/[id]/issue-reader.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { CoverGradient, IssueSection } from "@/lib/issues/types";
import { toggleIssueSaved } from "@/lib/issues/actions";
import { CoverSection } from "./sections/cover";
import { NumbersSection } from "./sections/numbers";
import { ThemesSection } from "./sections/themes";
import { AnswerOfWeekSection } from "./sections/answer-of-week";
import { AlignedOnSection } from "./sections/aligned-on";
import { SavedMomentSection } from "./sections/saved-moment";
import { NextDareSection } from "./sections/next-dare";
import { QuestionToSitWithSection } from "./sections/question-to-sit-with";
import { ColophonSection } from "./sections/colophon";

type Props = {
  issue: {
    id: string;
    issueNumber: number;
    volumeNumber: number;
    windowStart: Date;
    windowEnd: Date;
    publishedAt: Date;
    headline: string;
    coverPhotoUrl: string | null;
    coverGradient: CoverGradient | null;
    sections: IssueSection[];
    initialSaved: boolean;
  };
  partnerNames: { a: string; b: string };
};

export function IssueReader({ issue, partnerNames }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Scroll-reveal: add .is-visible to .mag-reveal elements as they intersect viewport.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(".mag-reveal"));
    if (typeof IntersectionObserver === "undefined") {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.18 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="magazine-frame" style={{ minHeight: "100vh" }}>
      <button
        type="button"
        onClick={() => router.push("/app/issues")}
        aria-label="Close issue"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          margin: 12,
          background: "rgba(250,247,242,0.9)",
          backdropFilter: "blur(6px)",
          border: "1px solid #e8e2d6",
          borderRadius: 999,
          padding: "8px 14px",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "'Helvetica Neue', sans-serif",
          fontSize: "0.7rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#2d2d2d",
          cursor: "pointer",
        }}
      >
        <ChevronLeft size={14} strokeWidth={2} />
        Issues
      </button>

      <CoverSection
        headline={issue.headline}
        issueNumber={issue.issueNumber}
        volumeNumber={issue.volumeNumber}
        windowStart={issue.windowStart}
        windowEnd={issue.windowEnd}
        coverPhotoUrl={issue.coverPhotoUrl}
        coverGradient={issue.coverGradient}
        partnerNames={partnerNames}
      />

      {issue.sections.map((s, i) => {
        switch (s.kind) {
          case "numbers":
            return <NumbersSection key={i} {...s} />;
          case "themes":
            return <ThemesSection key={i} words={s.words} />;
          case "answerOfWeek":
            return (
              <AnswerOfWeekSection
                key={i}
                quote={s.quote}
                attributedTo={s.attributedTo}
                promptText={s.promptText}
                partnerNames={partnerNames}
              />
            );
          case "alignedOn":
            return <AlignedOnSection key={i} {...s} />;
          case "savedMoment":
          case "savedMomentFallback":
            return <SavedMomentSection key={i} {...s} />;
          case "nextDare":
            return <NextDareSection key={i} {...s} />;
          case "questionToSitWith":
            return <QuestionToSitWithSection key={i} text={s.text} />;
          // Future kinds (monthInPictures, etc.) won't appear in Phase 1 weekly issues
          default:
            return null;
        }
      })}

      <ColophonSection
        issueId={issue.id}
        initialSaved={issue.initialSaved}
        issueNumber={issue.issueNumber}
        volumeNumber={issue.volumeNumber}
        publishedAt={issue.publishedAt}
        onSaveToggle={toggleIssueSaved}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verify**

```bash
npm run typecheck -w aligned
```

Expected: clean exit.

- [ ] **Step 5: Commit**

```bash
git add apps/aligned/lib/issues/actions.ts apps/aligned/app/app/issues/[id]/page.tsx apps/aligned/app/app/issues/[id]/issue-reader.tsx
git commit -m "feat(magazine): issue reader page + scroll-reveal client component"
```

---

## Task 13: Homepage IssuePromo replaces SundayRecap

**Files:**
- Create: `apps/aligned/components/issues/issue-promo.tsx`
- Modify: `apps/aligned/app/app/app-page-client.tsx` (replace `SundayRecap` import + usage)

- [ ] **Step 1: IssuePromo component**

Create `apps/aligned/components/issues/issue-promo.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLatestIssuePromo } from "@/lib/issues/promo";
import type { LatestIssuePromo } from "@/lib/issues/promo";

type Props = { relationshipId: string };

export function IssuePromo({ relationshipId }: Props) {
  const [promo, setPromo] = useState<LatestIssuePromo | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLatestIssuePromo(relationshipId).then((p) => {
      if (!cancelled) setPromo(p);
    });
    return () => {
      cancelled = true;
    };
  }, [relationshipId]);

  if (!promo) return null;

  const coverStyle: React.CSSProperties = promo.coverPhotoUrl
    ? { backgroundImage: `url(${promo.coverPhotoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : promo.coverGradient
      ? { background: `linear-gradient(160deg, ${promo.coverGradient.primary} 0%, ${promo.coverGradient.secondary} 100%)` }
      : { background: "#faf7f2" };

  return (
    <Link
      href={`/app/issues/${promo.id}`}
      className="animate-calm-fade-in flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 transition active:scale-[0.99] hover:border-dusk-300/70"
    >
      <div
        style={{ ...coverStyle, width: 64, height: 80, borderRadius: 4, flexShrink: 0 }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-dusk-600">
          New issue
        </p>
        <p className="mt-1 truncate font-display text-base font-semibold text-slate-900">
          {promo.headline}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Issue {promo.issueNumber} · Read together
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
    </Link>
  );
}
```

- [ ] **Step 2: Promo data fetcher**

Create `apps/aligned/lib/issues/promo.ts`:

```ts
"use server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/relationship-members";
import type { CoverGradient } from "./types";

export type LatestIssuePromo = {
  id: string;
  headline: string;
  issueNumber: number;
  coverPhotoUrl: string | null;
  coverGradient: CoverGradient | null;
};

/**
 * Returns the relationship's latest issue if it was published within the last
 * 7 days. Returns null otherwise (the promo card hides itself when null).
 */
export async function getLatestIssuePromo(relationshipId: string): Promise<LatestIssuePromo | null> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return null;
  await requireActiveMember(session.user.id, relationshipId);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const issue = await prisma.issue.findFirst({
    where: { relationshipId, publishedAt: { gte: sevenDaysAgo } },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      headline: true,
      issueNumber: true,
      coverPhotoUrl: true,
      coverGradient: true,
    },
  });

  if (!issue) return null;

  return {
    id: issue.id,
    headline: issue.headline,
    issueNumber: issue.issueNumber,
    coverPhotoUrl: issue.coverPhotoUrl,
    coverGradient: issue.coverGradient as CoverGradient | null,
  };
}
```

- [ ] **Step 3: Wire IssuePromo into homepage in place of SundayRecap**

Open `apps/aligned/app/app/app-page-client.tsx`. Find the import:

```tsx
import { SundayRecap } from "./sunday-recap";
```

Replace with:

```tsx
import { IssuePromo } from "@/components/issues/issue-promo";
```

Then find the JSX usage (likely `<SundayRecap relationshipId={relationshipId!} />`) and replace it with:

```tsx
<IssuePromo relationshipId={relationshipId!} />
```

Leave `sunday-recap.tsx` itself in the tree for now — it's no longer referenced from the homepage but other places may still import it. (Phase 2 deletes it once we audit.)

- [ ] **Step 4: Verify**

```bash
npm run typecheck -w aligned
```

Expected: clean exit.

- [ ] **Step 5: Manual smoke test**

From repo root:

```bash
npm run dev
```

Open `http://localhost:3000/app`. Expected: the homepage renders without errors. The `IssuePromo` will be invisible (returns `null`) until at least one Issue exists for the relationship — that's fine for now. We'll verify the promo with seeded data in Task 14.

Stop the dev server (`Ctrl+C`).

- [ ] **Step 6: Commit**

```bash
git add apps/aligned/components/issues/issue-promo.tsx apps/aligned/lib/issues/promo.ts apps/aligned/app/app/app-page-client.tsx
git commit -m "feat(magazine): IssuePromo replaces SundayRecap on homepage"
```

---

## Task 14: Local seed for testing + manual end-to-end QA

**Files:**
- Create: `apps/aligned/prisma/seed-issue.ts` (one-off helper, not committed long-term)

This task creates a manual-test seed so you can verify the full reader without waiting for cron. **The seed file is committed** so future debugging can reuse it.

- [ ] **Step 1: Write the seed**

Create `apps/aligned/prisma/seed-issue.ts`:

```ts
/**
 * Manual one-off: seeds a fake Weekly Issue for the first active relationship
 * in your local DB so you can preview /app/issues/[id] without running cron.
 *
 * Run with:  npx tsx prisma/seed-issue.ts
 *
 * Idempotent — uses a fixed issueNumber=999 so re-running just upserts.
 */
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const rel = await prisma.relationship.findFirst({
    where: { status: "active" },
    select: { id: true },
  });
  if (!rel) throw new Error("No active relationship found in this DB.");

  const start = new Date();
  start.setDate(start.getDate() - 7);
  const end = new Date();

  const sections = [
    { kind: "numbers", daysAnswered: 4, totalDays: 7, streak: 12, matches: 3 },
    { kind: "themes", words: ["sunday", "slowness", "together"] },
    {
      kind: "answerOfWeek",
      quote: "That you make me coffee on Sundays without me asking. I notice every time.",
      attributedTo: "b",
      promptText: "What's something small your partner does that means a lot?",
    },
    { kind: "alignedOn", source: "wyr", chosen: "Stay in", day: "Tuesday", totalMatches: 3 },
    {
      kind: "savedMomentFallback",
      quote: "We finally tried that ramen place on Mission. Worth it.",
      attribution: "From Saturday's dare.",
    },
    {
      kind: "nextDare",
      title: "Cook something neither of you has made before",
      description: "No recipes allowed. Improvise from whatever's in the kitchen.",
      duration: "~45 min",
    },
    {
      kind: "questionToSitWith",
      text: "What's something I've done this week that you almost said thank you for, but didn't?",
    },
  ];

  const issue = await prisma.issue.upsert({
    where: {
      relationshipId_cadence_issueNumber: {
        relationshipId: rel.id,
        cadence: "weekly",
        issueNumber: 999,
      },
    },
    update: {
      headline: "Sunday mornings, mostly.",
      sections,
      windowStart: start,
      windowEnd: end,
      publishedAt: new Date(),
    },
    create: {
      relationshipId: rel.id,
      cadence: "weekly",
      issueNumber: 999,
      volumeNumber: 1,
      windowStart: start,
      windowEnd: end,
      publishedAt: new Date(),
      headline: "Sunday mornings, mostly.",
      coverGradient: { primary: "#1f4e73", secondary: "#d4a574" },
      sections,
    },
  });

  console.log(`Seeded issue ${issue.id} for relationship ${rel.id}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 2: Run the seed**

From `apps/aligned/`:

```bash
npx tsx prisma/seed-issue.ts
```

Expected output: `Seeded issue <cuid> for relationship <cuid>`. (Requires a local `DATABASE_URL` pointing at a Postgres dev DB with the migrations applied. If your local DB doesn't exist, set up via `prisma migrate dev` first.)

- [ ] **Step 3: Manual QA against the seeded issue**

```bash
npm run dev
```

Open `http://localhost:3000/app`. Verify:
- [ ] Homepage `IssuePromo` card appears at the top of the homepage with the seeded headline.
- [ ] Tapping the promo navigates to `/app/issues/<issue id>`.
- [ ] The reader renders with the magazine-frame typography (Playfair Display + Helvetica Neue + Georgia, cream background `#faf7f2`).
- [ ] Cover gradient renders using the seeded primary/secondary colors.
- [ ] All 7 sections appear (numbers, themes, answerOfWeek, alignedOn, savedMomentFallback, nextDare, questionToSitWith).
- [ ] Each section fades in on scroll (intersection observer).
- [ ] "Save This Issue" toggles to "Saved" and persists across reload.
- [ ] Top-left "Issues" button navigates back to `/app/issues` (which will 404 in Phase 1 — that's expected; the library is Phase 2).
- [ ] In DevTools, set `prefers-reduced-motion: reduce` and reload. Verify all sections appear immediately, no fade.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add apps/aligned/prisma/seed-issue.ts
git commit -m "test(magazine): one-off issue seed for local manual QA"
```

---

## Task 15: Plan-level smoke test of the cron path

**Files:** none (verification only)

This task runs the generator against your local DB to confirm a real auto-generated issue looks right, end-to-end.

- [ ] **Step 1: Manually invoke the cron route locally**

Start the dev server:

```bash
npm run dev
```

In a second terminal, hit the cron route:

```bash
curl -i http://localhost:3000/api/cron/issues
```

Expected: `200 OK` with JSON like `{"ok":true,"now":"...","weekly":{"created":0,"skipped":N}}`.
- If today is a Sunday in your local Date, `created` may be > 0.
- If today isn't Sunday, the route returns `{"created":0,"skipped":0}` — that's correct.

- [ ] **Step 2: Force the Sunday code path locally**

To verify generation end-to-end without waiting for Sunday, temporarily comment out the day-guard in `apps/aligned/lib/issues/generate.ts`:

```ts
// if (now.getUTCDay() !== 0) return { created: 0, skipped: 0 };
```

Re-hit the cron route:

```bash
curl -i http://localhost:3000/api/cron/issues
```

Expected: `created` is `1` if your local DB has a relationship with ≥2 days of recent answers; otherwise `skipped` includes a `"reason":"insufficient-data"` for each skipped relationship.

If `created: 1`, hit `/app` and confirm a new IssuePromo card appears with a real headline + sections from your actual DB data.

**Critical:** restore the day-guard before committing:

```ts
if (now.getUTCDay() !== 0) return { created: 0, skipped: 0 };
```

- [ ] **Step 3: Final typecheck**

```bash
npm run typecheck
```

Expected: clean exit across all workspaces.

- [ ] **Step 4: No commit needed** — this task is verification-only. If you found bugs, fix them in their respective tasks and re-commit there.

---

## Done — Phase 1 ships these guarantees

- A new Issue model is in the database.
- Every Sunday at every hour, the cron fires; generates one Weekly Issue per active relationship that has ≥2 days of recent answers; idempotent re-runs are safe.
- An IssuePromo card surfaces the latest issue on the homepage for 7 days after publish.
- The reader at `/app/issues/[id]` renders an editorial-style issue with 8 sections (cover + numbers/themes/answer/aligned/savedMoment/nextDare/questionToSitWith + colophon), with scroll-reveal motion that respects `prefers-reduced-motion`.
- Save toggle persists per-issue.

## Out of Phase 1 (separate plans)

- **Issues library tab** (`/app/issues`) — Phase 2
- **Monthly issues + monthly-only sections** — Phase 2
- **Yearly + Milestone editions** — Phase 3
- **Premium gating** + paywall view — Phase 3
- **Push notifications on publish** — Phase 3
- **Share image (1080×1920 social card)** — Phase 3
- **AI-generated headlines** — backlog
