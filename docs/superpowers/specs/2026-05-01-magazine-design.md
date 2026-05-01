# Aligned: The Magazine — Design Spec

**Date:** 2026-05-01
**Status:** Approved for implementation planning
**Owner:** Aligned Connecting Couples

---

## 1. Goal

Create a premium, editorial-style **publication system** for couples that auto-publishes recurring "Issues" celebrating the relationship — Weekly, Monthly, Yearly, and Milestone editions. Every issue shares the same visual DNA, scaling content depth to its cadence. The Magazine is a flagship premium feature, designed to be screenshot-worthy for the App Store and emotionally meaningful enough to drive retention and subscription.

## 2. Aesthetic Direction

**"Modern Minimal" — Kinfolk / The Gentlewoman.**

- **Display type:** Playfair Display (serif, weights 300/400/700, italic)
- **Body type:** Georgia (serif)
- **UI/labels type:** Helvetica Neue (sans-serif, weights 200/400, wide letter-spacing for caps)
- **Surface color:** `#faf7f2` (warm cream, paper-like)
- **Ink color:** `#2d2d2d` (soft black)
- **Accents:** existing couple-color palette (already shipped via `lib/couple-colors.ts`) used sparingly — for cover gradients, dividers, page numbers
- **Section labels:** uppercase Helvetica Neue, `letter-spacing: 0.32em`, with a thin trailing rule line
- **Section markers:** Roman numerals (§ I, § II, § III)
- **Whitespace:** generous; long vertical rhythm; sections are 48px+ vertical padding
- **Photography:** when present, full-bleed or near-full-bleed with serif italic captions
- **Motion:** quiet. A page-fade on open, a section-reveal on scroll. No bouncing, no spinners.

Light + dark not in v1. Light-only first. (The cream surface is part of the aesthetic; flipping to dark would require a separate art-direction pass.)

## 3. Issue Cadences

Four cadences, each generated automatically, all sharing the same visual frame:

### Weekly Issue
- Auto-publishes every **Sunday morning local time** (uses each user's timezone)
- Window: previous Monday 00:00 → Sunday 00:00
- Issue numbering resets per couple (their personal `Vol. 1, No. 14`)
- Skipped if the couple answered <2 days that week (no padding for empty weeks)

### Monthly Issue
- Auto-publishes on the **1st of the month** at 8am local
- Window: full previous calendar month
- Always premium

### Yearly Issue
- Auto-publishes on **the couple's anniversary date** (or Jan 1 if no anniversary set)
- Window: previous 12 months
- Always premium
- Has additional sections (see §6.3)

### Milestone Issues
Auto-fire when triggered (one-shot, not recurring):
- **30-day streak**
- **100-day streak**
- **365-day streak**
- **First anniversary together** (1 year of using Aligned, or actual relationship anniversary if known)
- **Each subsequent anniversary** (2-year, 5-year, 10-year)

Always premium. Higher production value (extra cover treatment, dedicated section, more photos).

## 4. Premium Gating

| Cadence | Free | Premium |
|---|---|---|
| Weekly | First 2 issues free | All subsequent |
| Monthly | None | All |
| Yearly | None | All |
| Milestone | None | All |

Gating is **per-relationship**, not per-user. Either partner upgrading unlocks all issues for both. Free users see a teaser of locked issues: cover + section list, blurred body, an upgrade CTA.

## 5. Information Architecture

### 5.1 Where it lives in the app
- **New `/app/issues` route** with a bottom-nav entry: **"Issues"** (icon: open book or magazine glyph)
- Nav order becomes: Today · Memories · **Issues** · Us
- Issues tab is the magazine library: cover-grid of past issues, newest first
- Tapping an issue cover opens the full reader

### 5.2 Homepage integration
- Replace the existing `SundayRecap` component with `IssuePromo`
- `IssuePromo` shows for 7 days after a new issue is published (any cadence)
- Layout: small cover thumbnail + headline + "Read Issue Fourteen →"
- After 7 days, the promo collapses; users find the issue in the Issues tab

### 5.3 Issue Reader
- Full-screen takeover (modal-like; not under the bottom nav)
- Swipe-down or back arrow to dismiss
- Single-column scroll, top-down (cover → §I → §II → ... → colophon)
- Page-fade animation on entry; section-reveal on scroll (intersection observer)
- "Save This Issue" CTA at the bottom (toggles `Issue.savedAt`)
- "Share" generates a single image (see §9)

## 6. Issue Structure

### 6.1 Common sections (every cadence)

1. **Cover** — masthead, issue number, headline, couple's first names, date range
2. **§ I — The Numbers** — Days answered / total · Streak · Matches
3. **§ II — Recurring Themes** — top 3 words from both partners' answers
4. **§ III — Answer of the Week** — best pull-quote (most-reacted-to or most-saved answer)
5. **§ IV — Where You Aligned** — best WYR/Quiz match
6. **§ V — A Saved Moment** — a dare photo or memory (see §6.4)
7. **§ VI — On the Cover Next Week** — next cadence's preview (next week's dare, next month's focus, etc.)
8. **§ VII — A Question to Sit With** — a generated reflection prompt for the period ahead
9. **Colophon** — close, save CTA, share CTA

### 6.2 Monthly additions
- **§ A — The Month in 4 Pictures** — up to 4 saved-photo memories from the month
- **§ B — Most Asked About** — the category they answered most (gratitude, reflection, etc.)

### 6.3 Yearly additions
- **§ A — A Year in Numbers** (expanded — total questions, total memories, total matches)
- **§ B — Twelve Months, Twelve Photos** — one photo per month if available
- **§ C — The Five Best Answers** — top 5 saved/most-resonated answers
- **§ D — How You've Changed** — heuristic comparison of early vs. recent answers (e.g., category drift, depth-level drift)

### 6.4 Photo selection logic
The "saved moment" photo is chosen via this priority:
1. Most recent **dare photo** in the window
2. Most recent **memory photo** in the window
3. None (section omitted, replaced with a pull-quote)

## 7. Headline Generation

### 7.1 v1: Template-only (ship first)
Templates are typed structures with content slots. Example:
```
"A week of {topWord1} and {topWord2}."
"{topWord1}, mostly."
"You both kept coming back to {topWord1}."
"The week of {bestMatchTheme}."
```
The system picks a template deterministically (hash of relationshipId + weekKey) and fills slots from extracted data.

### 7.2 v2: AI-generated headlines (polish, post-launch)
Out of scope for v1. Documented here so we don't paint ourselves into a corner:
- Server-side LLM call (Anthropic API, Sonnet 4.6) at publish time
- Input: the week's answers (anonymized to "Partner A / Partner B"), top words, best match
- Output: one headline ≤ 8 words, in the magazine's voice
- Fallback to template if LLM fails or content is sensitive
- Cache: never regenerate; the headline is part of the issue

## 8. Cover Image

### 8.1 Photo cover
If a dare photo exists in the window: full-bleed photo with the headline overlaid in white serif italic (semi-transparent dark gradient overlay for legibility).

### 8.2 Gradient cover (default)
If no photo: a calm two-color gradient using the couple's palette from `lib/couple-colors.ts`. The headline sits on the gradient in the ink color.

No stock photos. No clip art. No emoji.

## 9. Save & Share

### 9.1 Save
- Tap "Save This Issue" on the colophon
- Sets `Issue.savedAt`
- Saved issues sort to the top of the Issues tab and get a small bookmark glyph

### 9.2 Share
- Tap "Share" on the colophon
- Generates a vertical (1080×1920) image of the **cover only** — no body content, no quotes, no answers
- Names default to first-initials only (`C. & S.`) — full names are off by default for privacy
- A toggle in the share sheet lets the user opt to use full first names if they want
- Image rendered server-side via `@vercel/og` (already a Next.js convention)

## 10. Notifications

### 10.1 Premium users
- Push at issue publish time:
  - **Weekly:** *"Your week's issue is out."* / *"Read it together over coffee."*
  - **Monthly:** *"April's issue is on the stands."* / *"A month of you two."*
  - **Yearly:** *"Your year together — published."* / *"The first issue of forever."*
  - **Milestone:** *"A special edition arrived."* / *"You hit 100 days. We made you something."*

### 10.2 Free users
- No push for locked issues (avoid feeling spammy)
- Homepage `IssuePromo` card surfaces the latest free issue (or upgrade CTA for locked)
- One push at the moment Weekly transitions from free to locked: *"Your free Issues are saved. Subscribe to keep the magazine coming."*

## 11. Data Model

### 11.1 New Prisma model: `Issue`
```prisma
model Issue {
  id             String          @id @default(cuid())
  relationshipId String
  cadence        IssueCadence    // weekly | monthly | yearly | milestone
  milestoneType  String?         // "30-day-streak" | "100-day-streak" | "1-year" | etc. (nullable, only for milestone)
  issueNumber    Int             // per-relationship, per-cadence sequential (#14 of weekly)
  volumeNumber   Int             // per-relationship, increments each calendar year (Vol. 1, Vol. 2)
  windowStart    DateTime        // inclusive
  windowEnd      DateTime        // exclusive
  publishedAt    DateTime        @default(now())

  // Content (snapshot at publish time)
  headline       String          // generated cover headline
  coverPhotoUrl  String?         // null if gradient cover
  coverGradient  Json?           // { primary: "#...", secondary: "#..." } when no photo
  sections       Json            // ordered list of rendered section payloads

  // Engagement
  savedAt        DateTime?       // null = not saved
  openedByA      DateTime?       // first-open timestamp per partner
  openedByB      DateTime?

  // Premium
  isPremium      Boolean         @default(false)

  relationship   Relationship    @relation(fields: [relationshipId], references: [id], onDelete: Cascade)

  @@unique([relationshipId, cadence, issueNumber])
  @@index([relationshipId, publishedAt])
}

enum IssueCadence {
  weekly
  monthly
  yearly
  milestone
}
```

### 11.2 Sections JSON shape
The `sections` field is a versioned JSON array. Each entry is a typed object:
```ts
type IssueSection =
  | { kind: "numbers", daysAnswered: number, totalDays: number, streak: number, matches: number }
  | { kind: "themes", words: string[] }
  | { kind: "answerOfWeek", quote: string, attributedTo: "a" | "b", promptText: string }
  | { kind: "alignedOn", source: "wyr" | "quiz", chosen: string, day: string, totalMatches: number }
  | { kind: "savedMoment", photoUrl: string, caption: string, source: "dare" | "memory" }
  | { kind: "savedMomentFallback", quote: string, attribution: string }
  | { kind: "nextDare", title: string, description: string, duration: string }
  | { kind: "questionToSitWith", text: string }
  | { kind: "monthInPictures", photoUrls: string[] }
  | { kind: "mostAskedAbout", category: string, count: number }
  | { kind: "yearInNumbers", totalQuestions: number, totalMemories: number, totalMatches: number, longestStreak: number }
  | { kind: "twelvePhotos", photosByMonth: Array<{ month: number, photoUrl: string | null }> }
  | { kind: "fiveBestAnswers", quotes: Array<{ quote: string, attributedTo: "a" | "b", promptText: string }> }
  | { kind: "howYouChanged", earlyCategory: string, recentCategory: string, depthDelta: number };
```
Snapshot is permanent — once published, the issue does not regenerate. If the user changes their name or deletes a memory, the issue keeps the old data.

## 12. Generation Pipeline

### 12.1 Scheduled jobs
A new `lib/issues/generate.ts` module exposes:
```ts
async function generateWeeklyIssues(now: Date): Promise<{ created: number, skipped: number }>;
async function generateMonthlyIssues(now: Date): Promise<{ created: number, skipped: number }>;
async function generateYearlyIssues(now: Date): Promise<{ created: number, skipped: number }>;
async function generateMilestoneIssues(now: Date): Promise<{ created: number }>;
```

These are invoked by Vercel Cron via a new API route `/api/cron/issues` that:
1. Reads the Vercel Cron auth header (`Authorization: Bearer ${CRON_SECRET}`) — 401 otherwise
2. Calls all four generators in sequence
3. Returns a summary JSON

Cron schedule (UTC, but each generator filters by user-local time):
- Weekly: hourly on Sundays (covers all timezones)
- Monthly: hourly on the 1st
- Yearly: hourly daily (anniversary check)
- Milestone: hourly daily (streak/anniversary check)

### 12.2 Per-couple generation
For each couple eligible at the current hour:
1. Compute window start/end
2. If an Issue already exists for this `(relationshipId, cadence, issueNumber)` → skip
3. Aggregate data (sessions, memories, dares, WYR matches, top words)
4. If insufficient data (Weekly: <2 days answered) → skip
5. Pick template, generate headline, choose cover photo or gradient
6. Build sections array
7. Insert `Issue` row
8. Send push notifications (premium users only, except milestone which always pushes)

The homepage `IssuePromo` queries `Issue.publishedAt > now - 7 days` for the relationship and shows the most recent. No flag column needed.

### 12.3 Idempotency
Every generator is safe to re-run. The unique constraint `[relationshipId, cadence, issueNumber]` prevents duplicates. Cron failures retry on the next hour without side effects.

## 13. UI Components

```
app/app/issues/
  page.tsx                  — Issues library (cover grid)
  [id]/
    page.tsx                — Issue reader (server component, fetches Issue by id)
    issue-reader.tsx        — Client component (scroll motion, save, share)
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
      month-in-pictures.tsx       — monthly+
      most-asked-about.tsx        — monthly+
      year-in-numbers.tsx         — yearly only
      twelve-photos.tsx           — yearly only
      five-best-answers.tsx       — yearly only
      how-you-changed.tsx         — yearly only

components/issues/
  issue-cover-card.tsx      — used in library + homepage promo
  issue-promo.tsx           — homepage "your latest issue" card
  upgrade-locked-issue.tsx  — paywall view shown to free users on premium issues

lib/issues/
  generate.ts               — orchestrator
  templates/
    weekly.ts
    monthly.ts
    yearly.ts
    milestone.ts
  headline.ts               — template selection + slot fill
  cover.ts                  — photo selection / gradient fallback
  themes.ts                 — top-words extraction
  best-answer.ts            — picks the answer-of-week
  best-match.ts             — picks the WYR/quiz match
  premium.ts                — gating logic (which issue is free vs locked)

app/api/cron/issues/route.ts          — cron entry point
app/api/issues/[id]/share-image/route.ts  — @vercel/og share-card generator
```

## 14. Testing

### 14.1 Unit tests
- `lib/issues/headline.test.ts` — slot fill, fallback when slots are empty
- `lib/issues/themes.test.ts` — word extraction (lowercase, stopword removal, top-N)
- `lib/issues/best-answer.test.ts` — tie-breaking, deterministic for fixed input
- `lib/issues/cover.test.ts` — photo selection priority, gradient fallback shape
- `lib/issues/premium.test.ts` — first-2-free logic, premium-always logic per cadence
- `lib/issues/generate.test.ts` — full window aggregation against a seeded fixture; idempotency check

### 14.2 Integration tests
- `app/api/cron/issues/route.test.ts` — auth check, generates expected issues for a fixture week
- `app/app/issues/[id]/issue-reader.test.tsx` — renders all section kinds without throwing; save toggle works; share button calls the share endpoint

### 14.3 Visual regression
- One snapshot per issue cadence (weekly, monthly, yearly, milestone) using a deterministic fixture. Stored in `apps/aligned/__snapshots__/issues/`.

### 14.4 Manual QA checklist
- [ ] Weekly issue publishes Sunday 8am local (verify with timezone-shifted user)
- [ ] Skipped weeks (couple answered <2 days) do not produce empty issues
- [ ] First 2 weekly issues are free, third is locked
- [ ] Premium user gets push, free user does not
- [ ] Saved issues appear at top of library
- [ ] Share image renders at 1080×1920, names use initials by default
- [ ] Couple-color gradient cover appears when no photo exists
- [ ] Reader sections animate in on scroll (intersection observer)
- [ ] Reduced-motion users get no scroll animations
- [ ] Issue reader works in both portrait and landscape
- [ ] Issue cover photo from a dare loads from Vercel Blob

## 15. Out of Scope (v1)

These are real ideas that should ship later, not now:

- **AI-generated headlines** (LLM call). v1 is template-only.
- **AI-generated cover art**. v1 is photo or gradient.
- **Editorial writing** (article-style entries beyond the question prompt). v1 sticks to data + pull-quotes.
- **Voice notes / audio** in issues. v1 is text + photos.
- **Couple-personalized magazine names** ("The Smith Quarterly"). v1 is "Aligned · The Magazine".
- **Print-on-demand physical copies**. v1 is digital only.
- **Custom issue editing** (letting users curate which sections appear). v1 is auto-only.
- **Dark mode** for the magazine reader.

## 16. Success Metrics

- **% of users who open their first Weekly Issue within 24h of publish** (target: 50%)
- **% of free-trial users who upgrade within 30 days of hitting their first locked issue** (target: 8%)
- **% of issues with a "Save" action** (target: 30%)
- **App Store screenshot adoption** — at least 2 of the 5 primary screenshots feature an issue cover within 60 days of launch

## 17. Rollout

- **Phase 1 (week 1–2):** Schema migration · weekly generator · reader UI · cover + numbers + themes + answer-of-week + aligned + saved-moment + colophon · homepage promo
- **Phase 2 (week 3):** Monthly generator + monthly-only sections · Issues library tab · save/share
- **Phase 3 (week 4):** Yearly generator + yearly-only sections · milestone generator · push notifications · premium gating · paywall view

Phase 1 is the demoable core. Phase 2 makes it complete. Phase 3 makes it a business.
