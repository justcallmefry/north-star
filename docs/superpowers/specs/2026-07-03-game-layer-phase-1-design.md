# Game Layer Phase 1: Called It + Grace Days — Design

**Date:** 2026-07-03
**Goal:** Make Aligned's daily loop feel like a co-op game the couple plays *together* — without betraying the app's warm, no-guilt tone. Phase 1 ships the two highest-impact, lowest-risk mechanics: a **prediction layer** ("Called It") across the daily question and WYR, and **Grace Days** (streak insurance).

---

## Why (competitive context)

Paired's stickiest mechanic is prediction: you don't just answer, you *guess what your partner will say* — being right feels like mind-reading, being wrong sparks the conversation. Aligned already has this in the Quiz, and an unused seed of it in the daily flow (`Prompt.partnerGuessEnabled` + `PreRevealGuess`), but no payoff moment anywhere.

Separately, Aligned has zero streak protection. A broken 60-day streak is a churn event (Duolingo's most-documented lesson; competitors sell streak protection as an IAP). Our version should feel like grace, not commerce.

**Strategic frame: co-op, not competitive.** The couple is the player. No couple-vs-couple leaderboards, ever.

## Non-Goals (Phase 1)

- No XP/levels/currency. The Couple Constellation progression system is Phase 2.
- No new game modes; we deepen existing ones.
- No changes to Quiz/Agreement (they already have guess mechanics).
- No paid streak repair. Grace Days are earned, never bought.

---

## Feature 1: "Called It" on Would You Rather

### Flow
1. User picks their own answer (existing, unchanged).
2. **New step** while waiting / immediately after picking: "Now call it — which way did **{partner}** go?" Two small option chips appear under the waiting card. Optional; skippable.
3. On reveal, after the existing slam animation:
   - Guess correct → **"You called it ✦"** badge with a small burst (reuses `wyr-match-burst` timing family).
   - Guess wrong → gentle line: "They surprised you — even better."
   - No guess → nothing new.

### Data
- `WyrParticipation.guess Int?` — 0/1, the guessed *partner* choice. Server-stored (survives devices; feeds future insights "mind-reading %").
- New server action `submitWyrGuess(wyrSessionId, guess)`; guarded like `submitWyrChoice`. Guess locked after reveal.
- `WyrForTodayResult` gains `myGuess: 0 | 1 | null` and `reveal.calledIt?: boolean`.

## Feature 2: Word Guess on the Daily Question

Upgrade the existing `PreRevealGuess` (currently: free-text, sessionStorage, shown only for `partnerGuessEnabled` prompts, echoed back as plain italic text — no payoff).

### Changes
1. **Show for all prompts** (not just `partnerGuessEnabled`). A guess works for any free-text answer.
2. Reframe copy to one-word-or-phrase: "Before you reveal — call one word they used."
3. **Payoff at reveal:** tokenize the guess and the partner's answer with the shared `tokenize()` (`lib/issues/stopwords.ts`). Any overlap →
   - **"🔮 Called it"** pill next to the partner's answer, matched word(s) highlighted with the existing `word-pulse` animation.
   - No overlap → keep the current gentle italic echo ("You guessed: …") — no failure framing.
4. Storage stays device-local (sessionStorage), matching the existing pattern. Known limitation: guess made on one device won't surface on another. Acceptable for Phase 1; server storage rides with Constellation in Phase 2.

New pure helper `lib/reveal/called-it.ts` → `detectCalledIt(guess, partnerText): string[]` (returns matched words) + tests.

## Feature 3: Grace Days (streak insurance)

### Rules
- **Earn:** each time the couple's streak crosses a multiple of 7 (day 7, 14, 21…), they earn **1 Grace Day**. Cap: **2** banked.
- **Spend (automatic):** if the couple misses exactly one day and reveals the next day, a Grace Day is consumed silently and the streak continues (+1 for the new day; the missed day is bridged, not counted).
- Gaps of 2+ missed days still reset — grace covers life, not absence.
- Never purchasable. Never guilt-framed.

### Copy (matches `lib/copy.ts` voice)
- Earned: "You've earned a Grace Day — if life gets in the way, your streak holds."
- Armed (missed yesterday, grace available, haven't answered yet): "A Grace Day is holding your streak. Answer today and it carries on."
- Used (revealed after a bridged miss): "Life happened yesterday. Your Grace Day held the streak."

### Data
- `Streak.graceDays Int @default(0)`
- `Streak.graceUsedDate DateTime? @db.Date` — the bridged (missed) day; lets the UI say "held" honestly.
- `StreakInfo` gains `graceDays`, `graceArmed?`, `graceJustUsed?`, `graceJustEarned?`.
- `getStreak()`: `daysDiff === 2 && graceDays > 0` → streak still shows as current with `graceArmed`.
- `updateStreakOnReveal()`: gap-of-one + grace available → consume; earn on `newCurrent % 7 === 0` (respecting cap).

### UI
- `StreakBadge`: small leaf/dot per banked Grace Day with accessible label ("1 Grace Day banked").
- After-reveal area: one-line notice on earn and on use (no modal, no confetti — grace is quiet).

---

## Architecture

```
prisma/schema.prisma                       ← WyrParticipation.guess, Streak.graceDays/graceUsedDate
prisma/migrations/…_game_layer_phase_1/    ← additive ALTERs only (safe with migrate deploy)
lib/streak.ts                              ← earn/spend logic (pure core extracted to streak-core.ts)
lib/streak-core.ts                         ← NEW: pure computeStreakUpdate() — unit-testable
lib/wyr.ts                                 ← guess in result type + submitWyrGuess action
lib/reveal/called-it.ts                    ← NEW: detectCalledIt()
app/app/wyr/wyr-client.tsx                 ← call-it chips + reveal badge
app/app/session/[id]/pre-reveal-guess.tsx  ← copy reframe, always-on
app/app/session/[id]/session-content.tsx   ← Called It payoff at reveal; grace notices
app/app/streak-badge.tsx                   ← grace indicator
lib/copy.ts                                ← new strings
```

All animations reuse existing keyframes; `prefers-reduced-motion` respected by inheritance.

## Rollout / risk

- Migration is additive (two nullable/defaulted columns) — safe for `prisma migrate deploy` on Vercel.
- Grace logic changes streak semantics only when `graceDays > 0`, which starts at 0 for everyone — no behavior change for existing couples until they earn one.
- WYR guess is optional and skippable; no flow is gated on it.

## Phase 2 (next, separate spec)

**Couple Constellation** — one living progression surface: every reveal adds a star, aligned answers link stars, milestones name constellations; weekly co-op quests feed special Magazine covers. Server-side guess storage moves there too.
