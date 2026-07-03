# Game Layer Phase 2: The Couple Constellation — Design

**Date:** 2026-07-03
**Goal:** Give every couple one living, growing surface that makes their history *visible* — so day 100 looks different from day 10. This is the progression system for Aligned, expressed in the app's own language (night sky / dusk brand) instead of XP bars and levels.

Builds on: `2026-07-03-game-layer-phase-1-design.md` (Called It + Grace Days).

---

## The idea

**Every day a couple reveals together places a star in their shared sky.** The sky is a Fermat spiral growing outward from the center (day one) — dense, organic, galaxy-like. It is derived entirely from history the app already stores; there is nothing to grind and nothing to lose.

- **Ordinary day** → small star in the couple's palette tones.
- **Aligned answers** (`detectAligned` ≥ "aligned") → brighter, larger star; consecutive aligned days link with thin constellation lines.
- **Saved memory** → the star twinkles.
- **Milestone check-ins** (7th, 30th, 100th, 365th total reveal — dedication-based, never resets) → named giant star ("One week", "Thirty days", …).

The sky is co-op progression with zero pressure: a missed day adds nothing but takes nothing away. That keeps it compatible with the no-guilt tone — it's an album that assembles itself, not a scoreboard.

## Non-Goals

- No couple-vs-couple comparison, no global rankings.
- No server-side persistence of the layout — it is a pure function of history (deterministic, cacheable later if needed).
- No dependence on Streak — the sky uses *total* reveals (dedication), so streak resets never hurt it.
- Share-card image export: Phase 2.5 (the layout is deterministic, so export is easy to add later).

## Architecture

```
lib/constellation-core.ts        ← NEW, pure: Fermat-spiral layout, links, viewBox (unit-checked)
lib/constellation.ts             ← NEW, "use server": aggregates revealed sessions,
                                    aligned detection, saved-memory set, milestone labels
app/app/constellation/page.tsx   ← NEW server page → passes data to client
app/app/constellation/constellation-client.tsx ← NEW: SVG sky, tooltips, stats, empty state
app/app/constellation-promo.tsx  ← NEW: compact Today-screen entry card ("N stars in your sky")
app/app/insights/page.tsx        ← link card to the sky
app/globals.css                  ← star-twinkle keyframes (+ reduced-motion override)
scripts/check-game-layer.ts      ← layout math checks appended
```

**No schema changes.** Everything derives from `DailySession` (revealed) + `Response` + `Memory`.

## Layout math (constellation-core)

- Star *n* (0-based) sits at angle `n × 137.508°` (golden angle), radius `scale × √n`, plus small deterministic jitter hashed from `relationshipId + index` so the spiral feels organic.
- Size/brightness tiers: `base < aligned < deeplyAligned < milestone`.
- Links: consecutive aligned stars within 7 index steps connect with a low-opacity line — little constellations emerge naturally from streaks of alignment.
- ViewBox derived from max radius; the sky literally grows as the couple does.

## Visual language

- Background: dusk-800 → near-black gradient (the brand's namesake finally gets its night sky).
- Ordinary stars: warm white. Aligned stars: the couple's palette `primary`/`secondary` (from `getCouplePalette`) alternating by who-knows-whom… no — alternating adds meaning we can't back; aligned stars use `secondary`, milestone stars use `primary`, with soft SVG glow.
- Saved-memory stars twinkle (CSS opacity keyframes, disabled under `prefers-reduced-motion`).
- Tap/hover a star → tooltip: date, aligned/kept status, link to that session.

## Copy (voice check)

- Header: "Your sky" / "Every star is a day you showed up for each other."
- Stats: "42 stars · 11 aligned · 6 kept"
- Empty: "Your sky is waiting. Answer today's question together to place the first star."
- Today promo: "{N} stars in your sky" + "See your constellation →"

## Performance note

A year-long couple ≈ 365 sessions × 2 small text responses — one query with responses included, aligned detection is O(words). Fine uncached at this scale; if it ever shows up in traces, snapshot per-session aligned level at reveal time (column exists conceptually; deferred deliberately).

## Phase 2.5+ (not now)

- Shareable sky card (SVG → PNG export).
- Weekly co-op quests ("5 reveals + 1 dare this week") that gild the week's stars and feed special Magazine covers.
- WYR/Quiz/Called-It results as shooting stars / secondary constellations.
