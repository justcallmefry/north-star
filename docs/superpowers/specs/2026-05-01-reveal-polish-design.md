# Reveal Polish: Daily Question + WYR — Design

**Date:** 2026-05-01
**Goal:** Make the first-reveal moment for Daily Questions and Would You Rather feel dynamic, alive, and emotionally rewarding — without changing the underlying flow or adding new mechanics.

---

## Problem

The current reveal experiences are functional but flat on first view:

- **Daily Question:** Beautiful seal animation opens, then answers fade in via a static cascade. Once visible, they sit there. Shared words get a small pill. Match feels under-celebrated.
- **WYR:** Two buttons → both submit → static comparison cards with a green/amber border + glow. The reveal is the same visually whether you matched or not — the moment isn't a moment.

User said it directly: *"I like the list of answers we have now but something more dynamic the first time would be really fun."*

We are **not** redesigning the flow. We are **not** adding new mechanics (no guess-first, no new screens). We are upgrading the existing reveal beats so the *first* viewing of an answer feels like a real event.

## Non-Goals

- No new game modes (Guess Your Partner, Appreciation, etc. — those are a separate phase).
- No new database models, server actions, or pages.
- No changes to history view (subsequent views stay calm/list-like).
- No changes to the seal animation itself (it already works).

## Architecture

Pure client-side polish. Three new presentational components + animation primitives in CSS.

```
app/app/session/[id]/session-content.tsx   ← orchestrates reveal, calls new components
  ├─ <UnfoldCard>                          ← NEW: paper-fold container animation
  ├─ <StreamingText>                       ← NEW: word-by-word text reveal
  └─ <AlignedStamp>                        ← NEW: match celebration overlay

app/app/wyr/wyr-client.tsx                 ← adds drumroll/slam/burst phases
  ├─ <MatchCelebration>                    ← NEW: sparkle burst component
  └─ <MismatchPaths>                       ← NEW: gentle two-paths animation

app/globals.css                            ← new keyframes for unfold, pulse, drumroll, slam, burst
```

No new files outside these areas. No DB changes. No API changes.

---

## Daily Question Reveal — Detailed Flow

### 1. Existing flow stays
- Tap "Reveal answers" → existing seal animation (1.3s) → existing reveal stamp (700ms).

### 2. Your answer card unfolds + streams
After the reveal stamp, the user's own answer card transitions through:
- **Unfold (~500ms):** Card appears as a folded letter, then unfolds via CSS transform. Subtle paper-fold effect using `transform: rotateX()` and `transform-origin: top center`.
- **Stream (~600–1200ms):** Once unfolded, text appears word-by-word. ~40ms per word. Capped at 2000ms total for very long answers.

### 3. Partner reveal button
"Ready to see what they wrote?" button — existing, unchanged. User taps when ready.

### 4. Partner's answer card unfolds + streams
Same unfold + stream pattern as step 2.

### 5. Match moment fires (if applicable)
After both texts are fully streamed in, the match detection runs:

- **2+ shared words:** A `<AlignedStamp>` slides in below the partner card with text "✨ aligned." Shared words inside both answer cards pulse simultaneously (`@keyframes word-pulse-shared`, ~1s, single play).
- **4+ shared words:** Same animation but stamp text reads "✨ deeply aligned" and the pulse plays twice in succession.
- **0–1 shared words:** No stamp, no pulse. Existing novelty tags and follow-up prompt appear as normal — the moment isn't forced.

The match logic reuses the existing shared-words detection in `lib/recap.ts` / `lib/issues/stopwords.ts` (already extracted and shared). No new server logic.

### 6. Existing post-reveal stuff continues
Novelty tags, follow-up prompt, reactions, save-to-memory — all unchanged, all fade in normally.

---

## WYR Reveal — Detailed Flow

### 1. Selection
Tap a choice → card lifts (existing). Lift gets slightly more pronounced (~6px → ~10px) and adds a soft drop shadow.

### 2. Waiting state
**NEW: Both cards breathe.** A slow `@keyframes wyr-breathe` runs (~3s loop, very subtle scale 1.00 ↔ 1.015). Tells the user the system is alive, not stuck. Stops once partner submits.

### 3. Drumroll (~700ms)
**NEW:** Partner submits → "Revealing your match…" message appears + both cards do a 3-pulse synchronized beat (`@keyframes wyr-drumroll`). Builds anticipation. Existing auto-reveal logic stays — the drumroll just adds a pause beat between submission and visual reveal.

### 4. Slam
**NEW:** Cards animate to centered side-by-side position with a brief overshoot (`@keyframes wyr-slam`, ~400ms, cubic-bezier ease).

### 5. Match or mismatch celebration
- **Match (both chose same option):** `<MatchCelebration>` fires — soft burst of color radiating from card edges, light emoji confetti (~6 small particles, ~1s), message slides up from below: *"You matched. Same instinct."*
- **Mismatch (different choices):** `<MismatchPaths>` fires — cards lean apart slightly (rotate ±2deg), warm message slides up: *"Two different paths. Worth talking about tonight."* Tone is curious, never apologetic.

### 6. Settled state
Both badges visible (existing). Match-glow (existing) continues subtly. User can tap to acknowledge or move on.

---

## Match Detection Logic

Single shared rule across daily questions:

```ts
function detectAligned(myWords: string[], partnerWords: string[]): "none" | "aligned" | "deeplyAligned" {
  const shared = myWords.filter(w => partnerWords.includes(w));
  if (shared.length >= 4) return "deeplyAligned";
  if (shared.length >= 2) return "aligned";
  return "none";
}
```

- Words come from the existing `tokenize()` function in `lib/issues/stopwords.ts`.
- Case-insensitive.
- Stopwords already filtered out.
- No theme/sentiment detection — we're not adding LLM calls.
- WYR doesn't need this logic; match is a literal `choice === partnerChoice` check.

---

## Animations — Reference Table

| Animation               | Duration  | Trigger                        | What it does                                          |
| ----------------------- | --------- | ------------------------------ | ----------------------------------------------------- |
| `paper-unfold`          | 500ms     | Card mounts after reveal stamp | Card unfolds from rotateX(-90deg) → 0                  |
| `streaming-text`        | 600-2000ms| After unfold completes         | Text appears word-by-word, ~40ms/word, capped at 2s   |
| `aligned-stamp-in`      | 700ms     | After both texts settle + match| Stamp slides up + scale bounce                        |
| `word-pulse-shared`     | 1000ms    | Same trigger as stamp          | Shared words pulse (opacity + scale + glow)           |
| `wyr-breathe`           | 3s loop   | Waiting for partner            | Subtle scale loop on both cards                       |
| `wyr-drumroll`          | 700ms     | Partner submits                | 3 synchronized pulses                                 |
| `wyr-slam`              | 400ms     | After drumroll                 | Cards converge with overshoot                         |
| `wyr-match-burst`       | 1000ms    | Match revealed                 | Color radiates + confetti particles                   |
| `wyr-mismatch-lean`     | 800ms     | Mismatch revealed              | Cards rotate ±2deg apart                              |

All easings: `cubic-bezier(0.22, 1, 0.36, 1)` to match existing app feel.

---

## Edge Cases

**`prefers-reduced-motion: reduce`**
- Streaming text → instant full-text appearance.
- Unfold → instant card visibility (no rotation).
- Drumroll → skipped entirely; reveal happens immediately.
- Slam → skipped; cards just appear.
- Match burst / mismatch lean → replaced with simple opacity fade for the message.
- Pulse animations → no movement; shared words still get a static color tint.

**Very short answers (≤3 words):**
Stream still runs but with a 200ms minimum total duration. Avoids "blink and miss" feel.

**Very long answers (40+ words):**
Total stream duration capped at 2000ms. Speed adjusts dynamically (long answers stream faster per word).

**Empty match (0–1 shared words):**
No celebration fires. Existing novelty tags and follow-up appear normally. Quiet calm, not forced.

**Mid-animation user taps in WYR:**
Pointer events disabled on cards during drumroll + slam phases. Re-enabled after match/mismatch celebration completes.

**Slow network:**
Streaming is purely client-side once data is loaded. No network impact during animation.

**Accessibility:**
- `<StreamingText>` renders with `aria-live="polite"` and `aria-atomic="true"` so screen readers announce the final text once, not each word.
- Cards keep their semantic role (`<article>` or equivalent).
- All animations respect `prefers-reduced-motion`.

---

## Implementation Notes

- **Match detection runs once per reveal**, on first mount with both texts present. Result is memoized in component state — animation should not replay if user navigates away and back.
- **Streaming uses `requestAnimationFrame`** + word-array splitting, not `setTimeout` per word (smoother on mobile).
- **All animations use CSS keyframes** where possible (better performance than JS-driven animation libraries).
- **No new dependencies**. Uses existing tools: React state, CSS animations, Tailwind utility classes.

---

## Out of Scope (Future Work)

- Guess-first mechanic (will come back as part of "New Game Modes" phase)
- Voice/audio cues
- Theme/sentiment-based match detection (LLM-driven)
- Animations on the history view
- Push notification animations

---

## Acceptance Criteria

- [ ] Daily question first-reveal: card unfolds, text streams in word-by-word.
- [ ] When 2+ shared words exist, "✨ aligned" stamp animates in and shared words pulse.
- [ ] When 4+ shared words exist, stamp reads "✨ deeply aligned" and pulse plays twice.
- [ ] When 0–1 shared words, no stamp/pulse fires.
- [ ] WYR shows breathing pulse on cards while waiting for partner.
- [ ] WYR shows drumroll → slam → match-or-mismatch celebration on reveal.
- [ ] All animations skip / collapse to fades when `prefers-reduced-motion: reduce`.
- [ ] Streaming text is read once by screen readers (aria-live="polite").
- [ ] No performance regressions on mid-range mobile devices.
- [ ] No DB or API changes.
