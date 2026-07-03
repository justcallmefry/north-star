# Aligned — Project Onboarding for Claude

> **Hey Claude!** This is a living onboarding doc for the Aligned codebase. Everything is on GitHub — clone it, read this, and you'll be up to speed in minutes.

---

## What Is Aligned?

**Aligned** is a premium couples connection app. Two partners answer daily prompts privately, then reveal their answers together, react, save memories, and build a daily relationship ritual. The experience has to feel fun, emotional, and worth opening every single day — not like a boring questionnaire.

**Live app:** deployed on Vercel  
**GitHub:** `https://github.com/justcallmefry/north-star`  
**Stack:** Next.js 14 App Router · TypeScript · Prisma · PostgreSQL · Tailwind CSS · Stripe · Resend · Vercel

---

## Getting Started on a New Machine

```bash
# 1. Clone
git clone https://github.com/justcallmefry/north-star.git
cd north-star

# 2. Install deps
npm install

# 3. Pull environment variables
# Ask the team for the .env file, or pull from Vercel:
# vercel env pull apps/aligned/.env.local

# 4. Run the app
cd apps/aligned
npx next dev
```

The app lives at `apps/aligned/`. This is a monorepo (root `package.json`) but `apps/aligned` is the only active app right now.

---

## Architecture at a Glance

```
north-star/
├── apps/
│   └── aligned/
│       ├── app/                    ← Next.js App Router
│       │   ├── (marketing)/        ← Public marketing pages
│       │   └── app/                ← Authenticated app shell
│       │       ├── session/[id]/   ← Daily question reveal experience
│       │       ├── wyr/            ← Would You Rather game
│       │       ├── quiz/           ← Quiz mode
│       │       ├── agreement/      ← Agreement/alignment questions
│       │       ├── appreciation/   ← Appreciation prompts
│       │       ├── dare/           ← Dare challenges
│       │       ├── memories/       ← Saved memory timeline
│       │       ├── insights/       ← Couple insights & patterns
│       │       ├── magazine/       ← Weekly editorial issue (new!)
│       │       ├── history/        ← Past session history
│       │       └── us/             ← Couple profile page
│       ├── lib/                    ← Business logic, DB queries, server actions
│       │   ├── sessions.ts         ← Daily question session logic
│       │   ├── wyr.ts              ← Would You Rather logic
│       │   ├── quiz.ts             ← Quiz logic
│       │   ├── agreement.ts        ← Agreement session logic
│       │   ├── appreciation.ts     ← Appreciation logic
│       │   ├── dare.ts             ← Dare logic
│       │   ├── memories.ts         ← Memory save/fetch
│       │   ├── insights.ts         ← Insights aggregator
│       │   ├── streak.ts           ← Streak tracking
│       │   ├── recap.ts            ← Weekly recap generation
│       │   ├── reveal/
│       │   │   ├── aligned.ts      ← Shared-word match detection
│       │   │   └── aligned.test.ts ← Tests for match detection
│       │   └── issues/
│       │       ├── stopwords.ts    ← Shared tokenizer (used by reveal + magazine)
│       │       └── ...             ← Magazine generation logic
│       ├── prisma/
│       │   └── schema.prisma       ← Database models
│       └── app/globals.css         ← All CSS keyframes + animation utilities
│
└── docs/
    └── superpowers/
        ├── specs/                  ← Design docs for each feature
        └── plans/                  ← Implementation plans
```

---

## The Daily Loop (Core UX)

1. **Today screen** — shows the day's prompt, any active game modes, streak, memories
2. **Answer privately** — user writes their answer, it's hidden from partner
3. **Wait** — both partners must answer before reveal unlocks
4. **Reveal** — seal animation opens → answers unfold with streaming text reveal
5. **Match moment** — shared words pulse, "✨ aligned" stamp if they matched meaningfully
6. **React + Save** — emoji reactions, save to memory timeline, follow-up prompt
7. **WYR / Quiz / Agreement** — bonus daily game modes with their own reveal mechanics

---

## What's Been Built

### Foundation
- Full auth (magic link via Resend, partner pairing)
- Prisma schema: `Session`, `WyrSession`, `QuizSession`, `AgreementSession`, `AppreciationSession`, `DareSession`, `Memory`, `Issue`, `BetaSignup`, `Relationship`, and more
- Stripe subscription with `Entitlements` gating premium features
- Push notifications, streak tracking, haptics, couple color pairs
- Today screen with all active content types
- History view (past sessions, scrollable)
- Memories timeline (save + view saved moments)
- Insights page (couple patterns, top words, compatibility signals)

### Magazine Phase 1 ✅ (shipped)
**What:** A weekly editorial experience called "Aligned The Magazine." Every Sunday, a per-couple AI-generated issue is created. It reads like a real magazine — cover, stats, theme, best answers, saved moments, next dare, and a closing question to sit with.

**Key files:**
- `lib/issues/` — magazine orchestrator, generators, aggregators
- `app/app/magazine/` — reader page with scroll-reveal sections
- `app/app/app-page-client.tsx` → `IssuePromo` replaces `SundayRecap` on homepage
- `app/api/cron/` — Sunday cron job that generates issues

**Design doc:** `docs/superpowers/specs/2026-05-01-magazine-design.md`

### Reveal Polish ✅ (shipped)
**What:** Made the first-reveal moment for daily questions and WYR feel dynamic and emotionally alive — without changing any flows or adding new mechanics. Pure client-side animation polish.

**New components:**
- `app/app/session/[id]/unfold-card.tsx` — paper-fold card entrance wrapper
- `app/app/session/[id]/streaming-text.tsx` — word-by-word text reveal with `requestAnimationFrame`
- `app/app/session/[id]/aligned-stamp.tsx` — "✨ aligned" / "✨ deeply aligned" stamp
- `lib/reveal/aligned.ts` — shared-word match detection (`detectAligned()`)

**Modified:**
- `app/app/session/[id]/session-content.tsx` — integrates UnfoldCard, StreamingText, AlignedStamp
- `app/app/wyr/wyr-client.tsx` — adds breathe → drumroll → slam → match/mismatch reveal phases
- `app/globals.css` — all new keyframes (paper-unfold, streaming, aligned-stamp, wyr-breathe, wyr-drumroll, wyr-slam, wyr-match-burst, wyr-mismatch-reveal)

**Design doc:** `docs/superpowers/specs/2026-05-01-reveal-polish-design.md`

### Game Layer Phase 1 ✅ (shipped)
**What:** First slice of the "co-op game" direction — a prediction layer ("Called It") plus streak insurance ("Grace Days"). Strategic frame: the couple is the player; no couple-vs-couple competition, ever.

- **Called It (WYR):** after picking your own answer, the first answerer can predict which way their partner went while waiting. Reveal shows "🔮 You called it" or a gentle miss line. Guess stored server-side (`WyrParticipation.guess`).
- **Called It (Daily Question):** the pre-reveal guess is now shown for *all* prompts (was gated on `partnerGuessEnabled`) and gets a payoff — guessed words matching the partner's answer light up as "🔮 Called it" pills (`lib/reveal/called-it.ts`, device-local storage).
- **Grace Days:** earn 1 per 7 consecutive days (cap 2, never purchasable); one is auto-consumed to bridge a single missed day. Pure logic in `lib/streak-core.ts` (unit-checked via `npm run check:game-layer`), DB fields `Streak.graceDays` / `Streak.graceUsedDate`, leaf indicators in `StreakBadge`, gentle earn/hold/used copy on Today card and post-reveal.

**Design doc:** `docs/superpowers/specs/2026-07-03-game-layer-phase-1-design.md` (includes Phase 2 direction: Couple Constellation progression + weekly co-op quests feeding Magazine covers)

### Game Layer Phase 2: Couple Constellation ✅ (shipped)
**What:** The progression system, in Aligned's own language. Every revealed day places a star in the couple's shared night sky (`/app/constellation`), laid out on a golden-angle Fermat spiral growing outward from day one. Aligned answers = brighter palette-colored stars that link into little constellations; saved memories twinkle; the 7th/30th/100th/365th total check-in becomes a named giant star. Derived 100% from existing history — **no schema changes**, dedication-based (streak resets never shrink the sky).

**Key files:**
- `lib/constellation-core.ts` — pure layout math (spiral, links, viewBox) — unit-checked
- `lib/constellation.ts` — server aggregation (revealed sessions + aligned detection + memories)
- `app/app/constellation/` — page + SVG sky client (tap a star → revisit that day)
- `app/app/constellation-promo.tsx` — Today-screen entry card; insights page links too

**Design doc:** `docs/superpowers/specs/2026-07-03-couple-constellation-design.md` (Phase 2.5 ideas: shareable sky card, weekly co-op quests, WYR shooting stars)

### Game Layer Phase 3: Fun Feel + Quests + Content ✅ (shipped)
**What:** Four features making the app feel physical, playful, and endless:

1. **Fun-feel motion pass** — WYR options are draggable cards: tap to pick, or *flick away the one that's not you* (fly-off + the keeper springs forward). Reusable pointer-gesture hook `lib/use-flick.ts` (dependency-free, axis-locked so scrolling stays free). Spring motion vocabulary in `globals.css` (`--ease-spring`, `card-pop-in`, `option-pop`); Today-screen rows assemble with staggered spring entrances; quiz selections pulse + haptic.
2. **Content expansion** — WYR 25 → 150 questions, dares 28 → 80, moved to `lib/content/` data modules. **Append-only** (sessions store indices by position); `check:game-layer` enforces prefix stability + uniqueness.
3. **Weekly co-op quest** — `lib/quests.ts` derives it from existing activity: 5 reveals + the week's dare + an appreciation = a **golden week**. Quest card on Today (invitation framing, zero guilt); golden weeks gild that week's stars with gold rings in the constellation, retroactively for all history. Shared ISO-week helpers in `lib/week.ts`.
4. **Shareable sky card** — "Share your sky" on the constellation page rasterizes the live SVG into a framed 1080×1350 PNG (native share sheet, download fallback). `app/app/constellation/share-sky-button.tsx`.

---

## Key Conventions

**Client vs Server components**
- Pages are Server Components by default — they fetch data, pass it as `initialData` to Client Components
- Client Components are named `*-client.tsx` (e.g. `wyr-client.tsx`, `quiz-client.tsx`)
- Pattern: `useState(initialData)` + `useEffect(() => setData(initialData), [initialData])` for server refresh sync

**Animations**
- All keyframes live in `app/globals.css`
- Tailwind `animation` utilities are registered in `tailwind.config.ts`
- All animations include `@media (prefers-reduced-motion: reduce)` overrides
- Easing convention: `cubic-bezier(0.22, 1, 0.36, 1)` throughout

**Feature gating**
- `lib/entitlements.ts` — `getEntitlements(relationshipId)` returns what a couple can access
- Stripe subscription drives premium features; free tier gets core daily loop

**Database**
- Prisma with PostgreSQL (Vercel-hosted)
- `lib/prisma.ts` — singleton client
- All DB access happens in `lib/*.ts` server-side files, never in components

**Stopword tokenizer**
- `lib/issues/stopwords.ts` exports `tokenize(text)` — used by both the magazine theme extractor and the reveal match detection

---

## Environment Variables Needed

```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
RESEND_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
OPENAI_API_KEY          ← used by magazine generator
```

Ask the team or pull via `vercel env pull` if you have Vercel CLI access.

---

## Design Docs & Plans

All specs and implementation plans live in `docs/superpowers/`:

| Doc | What it covers |
|-----|---------------|
| `specs/2026-05-01-magazine-design.md` | Magazine feature — full design |
| `specs/2026-05-01-reveal-polish-design.md` | Reveal polish — animations spec |
| `plans/2026-04-30-aligned-fun-and-premium-polish.md` | Earlier fun/premium polish plan |
| `plans/2026-05-01-magazine-phase-1.md` | Magazine Phase 1 implementation plan |
| `plans/2026-05-01-reveal-polish.md` | Reveal polish implementation plan |

---

## What's Next (as of July 2026)

We just shipped Reveal Polish and are entering a testing week. After that, the roadmap points toward:

- **New game modes** — Guess Your Partner, Appreciation mode, Memory Lane (each gets its own reveal mechanic)
- **Magazine Phase 2** — richer editorial content, couple-specific themes, better mobile reader
- **Premium retention loops** — weekly recaps, streak milestones, content packs

---

## Tone & Personality

The app is warm, modern, and never clinical. Copy avoids guilt, shame, or "your relationship needs work" framing. It should feel like a ritual you *want* to open, not a chore. When writing new UI copy, match the tone in `lib/copy.ts`.

---

*Clone the repo, read the specs in `docs/superpowers/`, and you'll know everything. All the code is on GitHub — nothing lives only on a local machine.*
