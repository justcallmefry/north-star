# Aligned — Fun & Premium Polish Pass

**Date:** 2026-04-30
**Scope:** Daily ritual polish, reveal moment intensification, weekly rhythm, throwback variant, microcopy library
**Out of scope:** New question modes (most exist), prompt content expansion, `mode` schema field, full Memory Lane feed, dark mode, i18n

## Goal

Make the Aligned daily ritual feel premium, emotionally rewarding, and worth returning to. The 8 modes the brief asked for already exist; the gap is polish, cohesion, and the reveal moment landing with weight.

## Primary problems addressed

| Problem | Approach |
|---|---|
| Daily experience feels too plain | Day-themed Today card, category/tone/time meta line, weekly rhythm signaling |
| Reveal moment not special enough | Slower partner-answer reveal, sticky React/Save/Talk action bar, quick 5-emoji row, novel-noun "first time you've heard this" tag |
| Not enough delight | Spring press easing, haptics on key moments, skeleton loaders, morphing button loading state |
| Not enough reason to return | Saturday Throwback variant — "a year ago you said…" with re-answer flow |
| Premium feel | Centralized microcopy, focus management, aria-live, featured "Also today" treatment |
| Question redundancy | Out of scope for this pass; flagged for content sprint |

## Section 1 — Reveal flow

### What's already there
- Two-step reveal (my answer → tap → partner's answer)
- Reveal stamp + cascade animation
- Shared-words moment
- Follow-up "Talk about it" card

### What's added
1. **Slower partner-answer reveal** — bump from default to 600ms `cubic-bezier(0.22, 1, 0.36, 1)` with `scale: 0.96 → 1` and opacity fade. Add a single haptic `tap` at reveal start.
2. **Sticky 3-action bar** — promote React · Save · Talk into a persistent action row directly under the partner answer card. Currently scattered post-reveal; this consolidates.
3. **Quick 5-emoji reaction row** — inline row of `❤️ 🥹 😂 💯 🔥` for one-tap reactions. Keep the existing full picker as a long-press / "more" affordance. Reactions still write to the existing `ResponseValidation` model.
4. **Novel-noun tag** — when the partner's answer contains a content word (length ≥ 4, not in stop-word list) that has never appeared in any of the partner's past responses for this couple, show a small `🌱 First time you've heard this` chip below the answer. Pure word-set diff, no AI. Computed server-side in `getSession()` and returned as `noveltyTags?: string[]`. Showing the tag is binary; we don't list the words.
5. **Streak milestone visuals** — three distinct treatments at the existing thresholds:
   - Day 7 — subtle confetti puff (8–12 particles), 1.2s, no sound
   - Day 30 — larger burst (20+ particles), 1.6s, gentle scale-pulse on streak badge
   - Day 100 / 365 — full-screen flourish: dimmed backdrop, large numeral fade-in, particle wash, dismissable. Lasts ~3s before auto-fade.

### Files touched
- `app/app/session/[id]/session-content.tsx` — reveal sequence timing, action bar layout, quick-react row
- `lib/sessions.ts` — add `noveltyTags?: string[]` to `GetSessionResult`, compute novel-noun diff in `getSession()`
- `components/streak-celebration.tsx` (existing) — extend with three milestone variants
- `globals.css` — new keyframe for partner-reveal scale-fade, confetti animation

### Risks
- Novel-noun detection could feel gimmicky on short answers. Guard: only show if combined answer wordcount ≥ 15 and detected words are content-bearing.
- Sticky action bar must not overlap reflection content on mobile. Test on small viewports.

## Section 2 — Today card + weekly rhythm

### Today card additions
1. **Day-themed eyebrow** — replace `"Today"` / `"Saturday — a softer one"` with a day+mode label: `"Tuesday — appreciation day"`. The 7 day labels are constants in `lib/copy.ts`.
2. **Meta line** — under the eyebrow, a small row: `Category · Tone · ~time`. Time mapping: depthLevel 1–2 → `~30s`, 3 → `~1 min`, 4–5 → `~2 min`. Hidden if any field is missing.
3. **Day-tinted gradient + border** — same card structure across all 7 days; only the gradient stops, border color, and eyebrow chip color shift. The Saturday peach treatment becomes one of seven variants. All variants stay restrained — no carnival.
4. **Skeleton loader** — replace the bare "no relationship / no session" fallback with a calm shimmer skeleton matching the card shape. Uses existing `reveal-shimmer` keyframe.

### Weekly rhythm — soft, not forced
- **Daily prompt scheduler stays unchanged.** No forced category by day-of-week; existing diversity/cooldown rules remain authoritative.
- **"Also today" featured slot** — the day's primary secondary mode gets promoted to a larger card with a warm accent ring at the top of the row:
  - Mon — Daily Q is the focus; no secondary promotion
  - Tue — Appreciation
  - Wed — Quiz
  - Thu — Daily Q (deeper) is the focus; no secondary promotion
  - Fri — Date Night Dare
  - Sat — Throwback (when eligible) or Memories
  - Sun — Weekly Reflection / Recap
- **Dismiss-for-today guard** — once a user has acted on the featured mode (or explicitly dismissed it), it demotes back to a standard row for that day. Stored in `localStorage` keyed by `relationshipId + featuredMode + dateStr`. No DB.

### Day theme tokens
Defined as one map in `lib/day-theme.ts`:
```ts
export const DAY_THEMES = {
  0: { key: "sun", label: "Sunday — reflection",   ... },
  1: { key: "mon", label: "Monday — light",        ... },
  2: { key: "tue", label: "Tuesday — appreciation", ... },
  // ...
};
```
Each entry exposes: `eyebrowChipClass`, `eyebrowDotClass`, `eyebrowTextClass`, `sectionClass`, `accentColor`. The Today card consumes the map; nothing else needs to know.

### Files touched
- `app/app/today-card.tsx` — consume `DAY_THEMES`, render meta line, replace eyebrow logic
- `app/app/app-page-client.tsx` — featured-slot logic for "Also today"
- `lib/day-theme.ts` (new) — theme map
- `lib/sessions.ts` — `getToday()` returns `category`, `tone`, `depthLevel` so the meta line can render

### Risks
- The Saturday peach treatment already exists; the new map must not regress it. Keep the same color values for the Sat entry.
- Day labels in English only; no i18n hooks added in this pass.

## Section 3 — Throwback variant + microcopy library + premium polish

### Throwback Today card

**Eligibility (all must hold):**
- Day is Saturday
- *Either* active member of the relationship has saved at least one `Memory` of `sourceType: "session_reveal"` aged ≥ 30 days (`Memory.savedAt` is per-user; we union both partners' saves)
- The deterministic date hash selects "throwback" (~50% of eligible Saturdays)

**Behavior:**
- Replaces the standard Today card on the Today screen
- Shows: eyebrow `"Saturday — look back"`, age line `"7 months ago, you both answered:"`, prompt text from the Memory snapshot, both saved answers in card-inner panels
- Action: `"Answer it again — see how you've grown"` → resolves the original `Memory.sourceId` to its source `DailySession`, reads its `promptId`, then creates a fresh `DailySession` for today using that `promptId`. Bypasses the prompt scheduler for this date only. (`Memory.snapshot` only stores prompt *text*, not id — hence the source-session lookup.)
- After re-answer + reveal, the reveal screen shows a "Then / Now" comparison: each partner's old answer above the new one with a thin connector and the months-ago label.

**Schema:** No changes. Uses existing `Memory.snapshot` (JSON) for display, existing `Memory.sourceId → DailySession.promptId` lookup for the re-answer, and a new `forcePromptId` param to the existing session-creation function.

### Microcopy library (`lib/copy.ts`)

A single typed constants file. Sample shape (full version in implementation plan):
```ts
export const COPY = {
  waiting:  { forPartner, forYou },
  reveal:   { pre, earned, novel, saved },
  empty:    { noPair, noToday },
  errors:   { submit, network },
  push:     { daily, partnerDone, bothDone },
  throwback: { eyebrow, ageLine, action },
};
```
Used immediately by new code in this pass. Existing scattered strings get replaced incrementally — not in this PR.

### Premium polish checklist
- Haptics on: Answer CTA tap, Reveal CTA tap, reaction tap, save-to-memory tap, milestone hit
- `active:scale-[0.98]` + `transition-transform` on all primary CTAs (`.ns-btn-primary`)
- Skeleton loaders: Today card, History list page, Session loading
- Morphing button loading state: instead of `"Saving…"` text, three animated dots inside the button while in-flight
- "Also today" featured card: larger padding, warm accent ring, stronger weight; non-featured rows stay compact
- `aria-live="polite"` on reveal-stage transitions and "partner answered" alerts
- Focus management: after partner reveal, programmatic focus moves to the partner-answer card

### Files touched
- `lib/copy.ts` (new)
- `app/app/today-card.tsx` (throwback variant render path)
- `app/app/today-throwback-card.tsx` (new)
- `lib/sessions.ts` — `getToday()` checks throwback eligibility, returns variant data
- `lib/throwback.ts` (new) — eligibility + memory-pick logic
- `app/app/session/[id]/session-content.tsx` — Then/Now treatment when revealing a throwback session
- `lib/sessions.ts` — `createSessionForDate(forcePromptId)` param
- Various — haptic + spring-press additions, skeleton components

## Architecture

```
Today screen
├─ AppPageClient (existing)
│  ├─ TodaySection
│  │  └─ getToday() → returns either:
│  │     ├─ standard variant (existing GetTodayResult + day theme + meta)
│  │     └─ throwback variant (new ThrowbackTodayResult)
│  ├─ TodayCard (renders standard, day-themed)
│  ├─ TodayThrowbackCard (renders throwback variant) NEW
│  └─ AlsoToday (featured-slot logic by day) UPDATED
│
Session screen
└─ SessionContent (existing)
   ├─ Reveal sequence with new timing, action bar, novelty tags
   └─ Then/Now treatment when session is a re-answer of a throwback NEW
```

## Data model changes

**None.** All work uses existing tables.

The `ThrowbackTodayResult` is purely a derived response shape; nothing persisted. The "re-answer" path uses a new `forcePromptId` parameter on the existing session-creation function and stores it as a normal `DailySession` linked to the same Prompt. The "this is a throwback session" detection at reveal time is by checking whether a Memory exists for the same prompt+relationship.

## Testing

- **Manual**: walk through Mon–Sun in dev (mock the date) to verify each day theme renders and "Also today" featured slot is correct.
- **Manual**: with a seeded saved Memory aged > 30 days, force Saturday + throwback hash to confirm the Throwback variant renders.
- **Manual**: complete a session, verify reveal sequence pacing feels right; verify quick-react row writes to ResponseValidation; verify novel-noun tag appears when injecting a unique word.
- **Type check**: `npm run typecheck`.
- **Build**: ensure no `"use server"` files export non-function values (recent regression).

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Featured-slot promotion feels naggy after user already acted | LocalStorage dismiss-for-today guard |
| Throwback variant fires for new couples with 1 thin memory | Require Memory age ≥ 30 days |
| Day-themed gradients drift from brand | Restrained palette; one map; QA each day in dev |
| Novel-noun tag feels gimmicky | Guard on combined wordcount; flag for removal if not loved |
| Streak milestone treatments feel cheesy | Restrained: short durations, no sound, no over-the-top copy |
| `lib/copy.ts` migration becomes a ghost task | Use `COPY.*` only in new code this pass; no legacy rewrite forced |

## Limitations

- No prompt content expansion — repetition pain is partly mitigated by rhythm/throwback but not fully solved. Flag for content sprint.
- No `mode` field on Prompt schema. Modes remain implicit (route + secondary tables). If we later need cross-mode unified prompts, revisit.
- LocalStorage dismiss state is per-device, not synced across devices. Acceptable for v1.
- Throwback Then/Now reveal only works for sessions that produce a Memory of `sourceType: "session_reveal"`. Other Memory types not surfaced.

## Recommended next pass (deferred)

1. **Content sprint** — 100+ new prompts across categories, written in voice. Add `mode` field to Prompt schema if cross-route unification matters.
2. **Memory Lane feed** — a full `/memories` ritual: weekly digest, partner-mention surfacing, search.
3. **Reaction analytics** — show which reactions a partner gives most (premium gating candidate).
4. **Push timing intelligence** — learn each user's response-time window, schedule daily nudge accordingly.
5. **i18n** — extract `lib/copy.ts` to a translation pipeline.
