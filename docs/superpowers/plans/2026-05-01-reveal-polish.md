# Reveal Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the first-reveal moment for Daily Questions and WYR feel dynamic and alive — paper-unfold card entrance, word-by-word streaming text, and an "✨ aligned" celebration when both partners used the same words.

**Architecture:** Pure client-side polish. Three new presentational components (`UnfoldCard`, `StreamingText`, `AlignedStamp`) + a pure `detectAligned()` utility. The daily session reveal integrates all three; WYR gets its own phase-based animation sequence (breathe → drumroll → slam → match/mismatch). No DB changes, no server actions, no new pages.

**Tech Stack:** Next.js App Router, React 18, Tailwind CSS, CSS keyframes, TypeScript. Testing: Vitest or Jest + @testing-library/react (match existing test setup).

---

## File Map

| File | Status | Responsibility |
|------|--------|---------------|
| `apps/aligned/app/globals.css` | Modify | All new keyframes (unfold, stream, aligned stamp, WYR phases) |
| `apps/aligned/app/app/session/[id]/streaming-text.tsx` | Create | Word-by-word text reveal component |
| `apps/aligned/app/app/session/[id]/unfold-card.tsx` | Create | Paper-fold entrance wrapper |
| `apps/aligned/app/app/session/[id]/aligned-stamp.tsx` | Create | "✨ aligned" stamp display |
| `apps/aligned/lib/reveal/aligned.ts` | Create | `detectAligned()` pure function |
| `apps/aligned/lib/reveal/aligned.test.ts` | Create | Unit tests for detectAligned |
| `apps/aligned/app/app/session/[id]/session-content.tsx` | Modify | Integrate unfold + stream + stamp |
| `apps/aligned/app/app/wyr/wyr-client.tsx` | Modify | Phase-based WYR animation sequence |

---

## Task 1: CSS Keyframes

**Files:**
- Modify: `apps/aligned/app/globals.css`

Append these keyframes after the existing `@keyframes wyr-match-glow` block (line ~527 in globals.css, just before the magazine-frame section).

- [ ] **Step 1: Append keyframes to globals.css**

Open `apps/aligned/app/globals.css`. Find the end of the wyr-match-glow block:
```css
@media (prefers-reduced-motion: reduce) {
  .animate-wyr-match-glow { animation: none; }
}
```

Append immediately after it:

```css
/* ───────────────────────────────────────────────────────────────
   Reveal Polish — Daily Question
   ─────────────────────────────────────────────────────────────── */

/* Card unfolds like a letter from top — 500ms */
@keyframes paper-unfold {
  0%   { transform: perspective(800px) rotateX(-90deg); opacity: 0; }
  60%  { transform: perspective(800px) rotateX(8deg);   opacity: 1; }
  100% { transform: perspective(800px) rotateX(0deg);   opacity: 1; }
}
.animate-paper-unfold {
  animation: paper-unfold 500ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transform-origin: top center;
}
@media (prefers-reduced-motion: reduce) {
  .animate-paper-unfold { animation: none; opacity: 1; }
}

/* Aligned stamp slides up + scale bounce */
@keyframes aligned-stamp-in {
  0%   { opacity: 0; transform: translateY(8px) scale(0.92); }
  70%  { opacity: 1; transform: translateY(-2px) scale(1.02); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-aligned-stamp-in {
  animation: aligned-stamp-in 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@media (prefers-reduced-motion: reduce) {
  .animate-aligned-stamp-in { animation: none; opacity: 1; }
}

/* Shared word pills pulse — single and double plays */
@keyframes word-pulse-shared {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.12); box-shadow: 0 0 0 4px rgba(31, 78, 115, 0.12); }
  60%  { transform: scale(0.97); }
  100% { transform: scale(1); box-shadow: none; }
}
.animate-word-pulse {
  animation: word-pulse-shared 1000ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.animate-word-pulse-2x {
  animation: word-pulse-shared 1000ms cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards,
             word-pulse-shared 1000ms cubic-bezier(0.22, 1, 0.36, 1) 1100ms forwards;
}
@media (prefers-reduced-motion: reduce) {
  .animate-word-pulse,
  .animate-word-pulse-2x { animation: none; }
}

/* ───────────────────────────────────────────────────────────────
   Reveal Polish — WYR
   ─────────────────────────────────────────────────────────────── */

/* Slow breathe on cards while waiting for partner */
@keyframes wyr-breathe {
  0%, 100% { transform: scale(1.000); }
  50%       { transform: scale(1.015); }
}
.animate-wyr-breathe {
  animation: wyr-breathe 3s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .animate-wyr-breathe { animation: none; }
}

/* 3-beat drumroll pulse before reveal */
@keyframes wyr-drumroll {
  0%, 100% { transform: scale(1); }
  15%       { transform: scale(1.025); }
  30%       { transform: scale(1); }
  48%       { transform: scale(1.025); }
  63%       { transform: scale(1); }
  78%       { transform: scale(1.025); }
  92%       { transform: scale(1); }
}
.animate-wyr-drumroll {
  animation: wyr-drumroll 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@media (prefers-reduced-motion: reduce) {
  .animate-wyr-drumroll { animation: none; }
}

/* Cards snap into revealed state */
@keyframes wyr-slam {
  0%   { transform: scale(0.97); }
  60%  { transform: scale(1.02); }
  100% { transform: scale(1); }
}
.animate-wyr-slam {
  animation: wyr-slam 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@media (prefers-reduced-motion: reduce) {
  .animate-wyr-slam { animation: none; }
}

/* Match result card bursts in */
@keyframes wyr-match-burst {
  0%   { transform: scale(0.9) translateY(8px); opacity: 0; }
  60%  { transform: scale(1.03) translateY(-2px); opacity: 1; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
.animate-wyr-match-burst {
  animation: wyr-match-burst 800ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@media (prefers-reduced-motion: reduce) {
  .animate-wyr-match-burst { animation: none; opacity: 1; }
}

/* Mismatch result card eases in */
@keyframes wyr-mismatch-reveal {
  0%   { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
.animate-wyr-mismatch-reveal {
  animation: wyr-mismatch-reveal 600ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@media (prefers-reduced-motion: reduce) {
  .animate-wyr-mismatch-reveal { animation: none; opacity: 1; }
}
```

- [ ] **Step 2: Verify no CSS syntax errors**

```bash
cd apps/aligned && npx tsc --noEmit
```
Expected: no errors (CSS isn't typechecked but this confirms the TS side is clean before we touch components).

- [ ] **Step 3: Commit**

```bash
git add apps/aligned/app/globals.css
git commit -m "feat(reveal): add animation keyframes for paper-unfold, streaming, aligned stamp, and WYR phases"
```

---

## Task 2: StreamingText Component

**Files:**
- Create: `apps/aligned/app/app/session/[id]/streaming-text.tsx`

- [ ] **Step 1: Write the component**

Create `apps/aligned/app/app/session/[id]/streaming-text.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const MIN_MS = 200;
const MAX_MS = 2000;
const MS_PER_WORD = 40;

interface Props {
  text: string;
  className?: string;
  /** When true, renders all text immediately (page-reload views, reduced-motion) */
  skip?: boolean;
  onComplete?: () => void;
}

export function StreamingText({ text, className, skip, onComplete }: Props) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  useEffect(() => {
    if (skip || prefersReduced) {
      setVisibleCount(words.length);
      onCompleteRef.current?.();
      return;
    }
    if (words.length === 0) {
      onCompleteRef.current?.();
      return;
    }
    const totalMs = Math.min(Math.max(words.length * MS_PER_WORD, MIN_MS), MAX_MS);
    const intervalMs = totalMs / words.length;
    let count = 0;
    let timerId: ReturnType<typeof setTimeout>;

    function tick() {
      count += 1;
      setVisibleCount(count);
      if (count < words.length) {
        timerId = setTimeout(tick, intervalMs);
      } else {
        onCompleteRef.current?.();
      }
    }

    timerId = setTimeout(tick, intervalMs);
    return () => clearTimeout(timerId);
  }, [words, skip, prefersReduced]);

  return (
    <span className={className} aria-live="polite" aria-atomic="true">
      {words.map((word, i) => (
        <span key={i} style={{ opacity: i < visibleCount ? 1 : 0 }}>
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
```

- [ ] **Step 2: Confirm it compiles**

```bash
cd apps/aligned && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/aligned/app/app/session/[id]/streaming-text.tsx
git commit -m "feat(reveal): StreamingText — word-by-word text reveal component"
```

---

## Task 3: UnfoldCard Component

**Files:**
- Create: `apps/aligned/app/app/session/[id]/unfold-card.tsx`

- [ ] **Step 1: Write the component**

Create `apps/aligned/app/app/session/[id]/unfold-card.tsx`:

```tsx
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export function UnfoldCard({ children, className }: Props) {
  return (
    <div className={`animate-paper-unfold${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Confirm it compiles**

```bash
cd apps/aligned && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/aligned/app/app/session/[id]/unfold-card.tsx
git commit -m "feat(reveal): UnfoldCard — paper-fold entrance wrapper"
```

---

## Task 4: detectAligned Utility + AlignedStamp Component

**Files:**
- Create: `apps/aligned/lib/reveal/aligned.ts`
- Create: `apps/aligned/lib/reveal/aligned.test.ts`
- Create: `apps/aligned/app/app/session/[id]/aligned-stamp.tsx`

- [ ] **Step 1: Create the utility**

Create `apps/aligned/lib/reveal/aligned.ts`:

```ts
import { tokenize } from "@/lib/issues/stopwords";

export type AlignedLevel = "none" | "aligned" | "deeplyAligned";

/**
 * Detects how many meaningful words two answer texts share.
 * "aligned"      = 2–3 shared words
 * "deeplyAligned" = 4+ shared words
 */
export function detectAligned(myText: string, partnerText: string): AlignedLevel {
  if (!myText || !partnerText) return "none";
  const myWords = new Set(tokenize(myText));
  const partnerWords = new Set(tokenize(partnerText));
  const shared = [...myWords].filter((w) => partnerWords.has(w));
  if (shared.length >= 4) return "deeplyAligned";
  if (shared.length >= 2) return "aligned";
  return "none";
}
```

- [ ] **Step 2: Write tests**

Create `apps/aligned/lib/reveal/aligned.test.ts`:

```ts
import { detectAligned } from "./aligned";

describe("detectAligned", () => {
  it("returns none when no shared meaningful words", () => {
    expect(detectAligned("love coffee morning", "night sleep dark")).toBe("none");
  });

  it("returns none for 1 shared word", () => {
    expect(detectAligned("coffee morning light", "morning dark cold")).toBe("none");
  });

  it("returns aligned for 2 shared meaningful words", () => {
    // "morning" and "coffee" are shared, length > 3, not stopwords
    expect(detectAligned("morning coffee ritual", "every morning coffee helps")).toBe("aligned");
  });

  it("returns aligned for 3 shared words", () => {
    expect(detectAligned("morning coffee ritual walk", "coffee ritual morning peaceful")).toBe("aligned");
  });

  it("returns deeplyAligned for 4+ shared words", () => {
    expect(
      detectAligned("morning coffee ritual walk together", "coffee morning walk ritual together peaceful")
    ).toBe("deeplyAligned");
  });

  it("ignores common stopwords", () => {
    // "this", "that", "from", "with" are all stopwords
    expect(detectAligned("this that from with", "this that from with")).toBe("none");
  });

  it("is case-insensitive", () => {
    expect(detectAligned("Coffee Morning Walk Together", "coffee morning walk peaceful")).toBe("aligned");
  });

  it("returns none for empty strings", () => {
    expect(detectAligned("", "")).toBe("none");
  });

  it("deduplicates repeated words within one answer", () => {
    // "coffee coffee coffee coffee" = still just 1 unique word
    expect(detectAligned("coffee coffee coffee coffee coffee", "morning coffee light")).toBe("none");
  });
});
```

- [ ] **Step 3: Run tests**

```bash
cd apps/aligned && npx vitest run lib/reveal/aligned.test.ts
```
(If project uses Jest instead: `npx jest lib/reveal/aligned.test.ts`)

Expected: 9 passing.

- [ ] **Step 4: Create the stamp component**

Create `apps/aligned/app/app/session/[id]/aligned-stamp.tsx`:

```tsx
import type { AlignedLevel } from "@/lib/reveal/aligned";

interface Props {
  level: Exclude<AlignedLevel, "none">;
}

export function AlignedStamp({ level }: Props) {
  return (
    <div className="animate-aligned-stamp-in flex justify-center py-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
        <span aria-hidden>✨</span>
        {level === "deeplyAligned" ? "deeply aligned" : "aligned"}
      </span>
    </div>
  );
}
```

- [ ] **Step 5: Confirm it compiles**

```bash
cd apps/aligned && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add apps/aligned/lib/reveal/aligned.ts apps/aligned/lib/reveal/aligned.test.ts apps/aligned/app/app/session/[id]/aligned-stamp.tsx
git commit -m "feat(reveal): detectAligned utility + AlignedStamp component"
```

---

## Task 5: Daily Question Reveal Integration

**Files:**
- Modify: `apps/aligned/app/app/session/[id]/session-content.tsx`

This task integrates `UnfoldCard`, `StreamingText`, and `AlignedStamp` into the existing daily reveal flow. Read the file before editing.

- [ ] **Step 1: Add imports**

At the top of `session-content.tsx`, after the existing imports (after line 26 `import { SealReveal }`), add:

```tsx
import { UnfoldCard } from "./unfold-card";
import { StreamingText } from "./streaming-text";
import { AlignedStamp } from "./aligned-stamp";
import { detectAligned } from "@/lib/reveal/aligned";
```

- [ ] **Step 2: Add streaming state**

Inside `SessionContent`, after the existing `useState` calls (after line 128 `const [memorySaving, setMemorySaving] = useState(false);`), add:

```tsx
const [myStreamDone, setMyStreamDone] = useState(false);
const [partnerStreamDone, setPartnerStreamDone] = useState(false);
```

- [ ] **Step 3: Reset streaming state on new reveal**

Inside `handleReveal()`, after `setRevealed(true)` (after line 180), add:

```tsx
setMyStreamDone(false);
setPartnerStreamDone(false);
```

- [ ] **Step 4: Replace the response card rendering**

Find this block in `session-content.tsx` (lines 585–650, inside `responsesToShow.map()`):

```tsx
return (
  <div
    key={resp.key}
    ref={!resp.isMe ? partnerAnswerRef : undefined}
    tabIndex={!resp.isMe ? -1 : undefined}
    className={`${useSlowReveal ? "animate-partner-reveal" : "animate-reveal-cascade"} space-y-1.5 ${
      idx === 0
        ? "reveal-cascade-delay-1"
        : idx === 1
          ? "reveal-cascade-delay-2"
          : idx === 2
            ? "reveal-cascade-delay-3"
            : "reveal-cascade-delay-4"
    }`}
  >
    <div className="flex items-center gap-2">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-base">
        {typeof resp.icon === "string" && resp.icon.trim().startsWith("http") ? (
          <img src={resp.icon.trim()} alt="" className="absolute inset-0 h-full w-full object-cover" width={36} height={36} />
        ) : (
          resp.icon
        )}
      </span>
      <span
        className={`rounded-full px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.14em] ${resp.bubbleClass}`}
      >
        {resp.title}
      </span>
    </div>
    <p className="ns-card-inner px-3 py-3 text-2xl leading-relaxed text-slate-900 sm:text-3xl">
      {ftsPrefix && resp.content
        ? `${ftsPrefix} ${resp.content}${ftsSuffix ?? ""}`
        : (resp.content ?? "—")}
    </p>
```

Replace it with:

```tsx
const streamText = ftsPrefix && resp.content
  ? `${ftsPrefix} ${resp.content}${ftsSuffix ?? ""}`
  : (resp.content ?? "—");
const cardContent = (
  <div className="space-y-1.5">
    <div className="flex items-center gap-2">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-base">
        {typeof resp.icon === "string" && resp.icon.trim().startsWith("http") ? (
          <img src={resp.icon.trim()} alt="" className="absolute inset-0 h-full w-full object-cover" width={36} height={36} />
        ) : (
          resp.icon
        )}
      </span>
      <span className={`rounded-full px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.14em] ${resp.bubbleClass}`}>
        {resp.title}
      </span>
    </div>
    <p className="ns-card-inner px-3 py-3 text-2xl leading-relaxed text-slate-900 sm:text-3xl">
      <StreamingText
        text={streamText}
        skip={!revealed}
        onComplete={() => {
          if (resp.isMe) setMyStreamDone(true);
          else setPartnerStreamDone(true);
        }}
      />
    </p>
```

Then wrap the whole return in `UnfoldCard` only for newly-revealed sessions:

```tsx
const inner = (
  <div
    key={resp.key}
    ref={!resp.isMe ? partnerAnswerRef : undefined}
    tabIndex={!resp.isMe ? -1 : undefined}
  >
    {cardContent}
    {/* ... rest of the card (novelty tags, saved guess, quick react row) ... */}
  </div>
);

return revealed ? (
  <UnfoldCard key={resp.key}>{inner}</UnfoldCard>
) : inner;
```

**Important:** The `key` prop must be on the outermost returned element. When wrapping with `UnfoldCard`, move `key` to `UnfoldCard`.

Full replacement for the map's return value:

```tsx
const streamText = ftsPrefix && resp.content
  ? `${ftsPrefix} ${resp.content}${ftsSuffix ?? ""}`
  : (resp.content ?? "—");

const cardInner = (
  <div
    ref={!resp.isMe ? partnerAnswerRef : undefined}
    tabIndex={!resp.isMe ? -1 : undefined}
    className="space-y-1.5"
  >
    <div className="flex items-center gap-2">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-base">
        {typeof resp.icon === "string" && resp.icon.trim().startsWith("http") ? (
          <img src={resp.icon.trim()} alt="" className="absolute inset-0 h-full w-full object-cover" width={36} height={36} />
        ) : (
          resp.icon
        )}
      </span>
      <span className={`rounded-full px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.14em] ${resp.bubbleClass}`}>
        {resp.title}
      </span>
    </div>
    <p className="ns-card-inner px-3 py-3 text-2xl leading-relaxed text-slate-900 sm:text-3xl">
      <StreamingText
        text={streamText}
        skip={!revealed}
        onComplete={() => {
          if (resp.isMe) setMyStreamDone(true);
          else setPartnerStreamDone(true);
        }}
      />
    </p>
    {!resp.isMe && data.noveltyTags && data.noveltyTags.length > 0 && (
      <p
        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
        role="note"
      >
        <span aria-hidden>🌱</span>
        First time you&apos;ve heard this
      </p>
    )}
    {!resp.isMe && savedGuess && (
      <p className="px-3 text-sm italic text-slate-500 sm:text-base">
        <span className="font-medium not-italic text-slate-600">You guessed: </span>
        {savedGuess}
      </p>
    )}
    {!resp.isMe && (partnerRevealed || data.state === "revealed") && (() => {
      const partnerResp = data.allResponses?.find((r) => r.userId === resp.key);
      if (!partnerResp?.id) return null;
      return (
        <div className="px-1 pt-1">
          <QuickReactRow responseId={partnerResp.id} initialReactions={null} />
        </div>
      );
    })()}
  </div>
);

return revealed ? (
  <UnfoldCard key={resp.key}>{cardInner}</UnfoldCard>
) : (
  <div key={resp.key}>{cardInner}</div>
);
```

- [ ] **Step 5: Update the shared-words section to use pulsed pills**

Find the existing shared-words block (around line 667–685 in the original):

```tsx
{(partnerRevealed || data.state === "revealed") && (() => {
  const shared = findSharedWords(responsesToShow);
  if (shared.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-1">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        You both mentioned
      </span>
      {shared.map((w) => (
        <span
          key={w}
          className="rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700"
        >
          {w}
        </span>
      ))}
    </div>
  );
})()}
```

Replace with (adds pulsed pill class):

```tsx
{(partnerRevealed || data.state === "revealed") && (() => {
  const shared = findSharedWords(responsesToShow);
  if (shared.length === 0) return null;
  const myResp = responsesToShow.find((r) => r.isMe);
  const partnerResp = responsesToShow.find((r) => !r.isMe);
  const alignedLevel =
    myResp?.content && partnerResp?.content
      ? detectAligned(myResp.content, partnerResp.content)
      : "none";
  const pulseClass =
    alignedLevel === "deeplyAligned"
      ? "animate-word-pulse-2x"
      : alignedLevel === "aligned"
        ? "animate-word-pulse"
        : "";

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-2 py-1">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          You both mentioned
        </span>
        {shared.map((w) => (
          <span
            key={w}
            className={`rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700 ${pulseClass}`}
          >
            {w}
          </span>
        ))}
      </div>
      {alignedLevel !== "none" && (
        <AlignedStamp level={alignedLevel} />
      )}
    </>
  );
})()}
```

- [ ] **Step 6: Confirm it compiles**

```bash
cd apps/aligned && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add apps/aligned/app/app/session/[id]/session-content.tsx
git commit -m "feat(reveal): integrate UnfoldCard + StreamingText + AlignedStamp into daily question reveal"
```

---

## Task 6: WYR Enhancements

**Files:**
- Modify: `apps/aligned/app/app/wyr/wyr-client.tsx`

- [ ] **Step 1: Add animation phase state**

In `WyrClient`, after the existing `useState` calls (after line 15 `const [loading, setLoading]`), add:

```tsx
const [showReveal, setShowReveal] = useState(initialData.state === "revealed");
const [animPhase, setAnimPhase] = useState<"idle" | "breathe" | "drumroll" | "slam">(
  initialData.state === "revealed" ? "slam" : "idle"
);
```

- [ ] **Step 2: Add drumroll → reveal sequence**

After the existing `useEffect` (lines 17–21 that call `haptic("reveal")`), add:

```tsx
useEffect(() => {
  if (data.state === "revealed" && !showReveal) {
    setAnimPhase("drumroll");
    const drumrollTimer = setTimeout(() => {
      setAnimPhase("slam");
      setShowReveal(true);
      void haptic("reveal");
    }, 700);
    return () => clearTimeout(drumrollTimer);
  }
}, [data.state, showReveal]);

useEffect(() => {
  if (data.myChoice != null && data.state === "open") {
    setAnimPhase("breathe");
  }
}, [data.myChoice, data.state]);
```

- [ ] **Step 3: Update the card `className` logic**

Find the `cardClass` construction block (lines 58–74). It currently sets classes based on `isRevealed`, `myChoice`, etc.

Replace the full `cardClass` block and the `return (` button element with:

```tsx
let cardClass =
  "relative flex min-h-[88px] w-full items-center rounded-2xl border-2 px-5 py-4 text-left text-lg font-semibold leading-snug transition active:scale-[0.98] ";

const isRevealed = showReveal && reveal != null;

if (isRevealed) {
  cardClass += isMine && isPartners
    ? "border-brand-400 bg-brand-50 text-brand-900 animate-wyr-match-glow"
    : isMine
      ? "border-brand-300 bg-brand-50/60 text-slate-900"
      : isPartners
        ? "border-violet-300 bg-violet-50/60 text-slate-900"
        : "border-slate-100 bg-white text-slate-400";
  if (animPhase === "slam") cardClass += " animate-wyr-slam";
} else if (myChoice != null) {
  cardClass += isMine
    ? "border-brand-400 bg-brand-50 text-brand-900 -translate-y-1 shadow-md"
    : "border-slate-100 bg-white text-slate-400";
  if (animPhase === "breathe") cardClass += " animate-wyr-breathe";
  if (animPhase === "drumroll") cardClass += " animate-wyr-drumroll";
} else {
  cardClass += "border-slate-200 bg-white text-slate-900 hover:border-brand-300 hover:bg-brand-50/40 cursor-pointer";
}

return (
  <button
    key={idx}
    type="button"
    disabled={myChoice != null || loading || animPhase === "drumroll"}
    onClick={() => handlePick(idx)}
    className={cardClass}
  >
    <span className="flex-1">{label}</span>
    {isRevealed && (
      <span className="ml-3 flex shrink-0 flex-col items-end gap-1 text-xs font-medium">
        {isMine && (
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-brand-700">You</span>
        )}
        {isPartners && (
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">
            {partnerName ?? "Them"}
          </span>
        )}
      </span>
    )}
  </button>
);
```

- [ ] **Step 4: Update the state/result section**

Find the States section (lines 102–135). Replace entirely with:

```tsx
{/* States */}
{myChoice == null && (
  <p className="text-center text-sm text-slate-400">Tap to pick. Your choice stays hidden until they answer.</p>
)}

{myChoice != null && data.state === "open" && !data.partnerSubmitted && (
  <div className="rounded-2xl border border-dusk-100 bg-gradient-to-br from-dusk-50 to-white p-5 text-center">
    <p className="text-base font-semibold text-slate-900">{partnerName ?? "Them"} hasn&apos;t picked yet.</p>
    <p className="mt-1 text-sm text-slate-600">Your choice is locked in. We&apos;ll reveal the match the moment they do.</p>
  </div>
)}

{animPhase === "drumroll" && (
  <div className="rounded-2xl border border-dusk-100 bg-gradient-to-br from-dusk-50 to-white p-5 text-center animate-pulse">
    <p className="text-base font-semibold text-slate-900">Both picks are in.</p>
    <p className="mt-1 text-sm text-slate-600">Revealing your match now…</p>
  </div>
)}

{showReveal && reveal && (
  reveal.matched ? (
    <div className="animate-wyr-match-burst rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-brand-50 px-5 py-5 text-center space-y-2">
      <p className="text-2xl" aria-hidden>✦</p>
      <p className="text-xl font-semibold text-emerald-800">You matched.</p>
      <p className="text-sm text-slate-600">Same instinct — that says something. Ask each other why.</p>
    </div>
  ) : (
    <div className="animate-wyr-mismatch-reveal rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/60 via-white to-white px-5 py-5 text-center space-y-2">
      <p className="text-2xl" aria-hidden>↔</p>
      <p className="text-xl font-semibold text-slate-800">You went different ways.</p>
      <p className="text-sm text-slate-600">Neither is wrong. This one&apos;s worth talking about tonight.</p>
    </div>
  )
)}
```

- [ ] **Step 5: Remove the now-unused old revealed condition**

The old `data.state === "revealed" && reveal &&` block has been replaced by `showReveal && reveal &&` in step 4. Remove any remaining reference to the old `const isRevealed = state === "revealed" && reveal != null;` that was scoped inside the `.map()` — it's now scoped correctly inside the map in step 3. Double-check there are no duplicate `isRevealed` variable declarations.

- [ ] **Step 6: Confirm it compiles**

```bash
cd apps/aligned && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add apps/aligned/app/app/wyr/wyr-client.tsx
git commit -m "feat(reveal): WYR phase-based animations — breathe, drumroll, slam, match burst, mismatch reveal"
```

---

## Task 7: Push to Production

- [ ] **Step 1: Final typecheck**

```bash
cd apps/aligned && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 2: Merge main + push**

```bash
cd "C:\Users\cfry\Desktop\North Star"
git checkout main
git pull origin main
git merge feat/reveal-polish --no-ff -m "feat: reveal polish — UnfoldCard, StreamingText, AlignedStamp, WYR phases"
git push origin main
```

---

## Acceptance Criteria

- [ ] Daily question first-reveal: each answer card unfolds from top with paper-fold animation.
- [ ] Each answer's text streams in word-by-word after the card unfolds.
- [ ] On page-reload of an already-revealed session, no streaming or unfold plays (text appears immediately).
- [ ] When 2–3 shared words: shared word pills animate with single pulse, "✨ aligned" stamp slides in.
- [ ] When 4+ shared words: pills animate with double pulse, stamp reads "✨ deeply aligned".
- [ ] When 0–1 shared words: no stamp, no pulse. Novelty tags and follow-up appear normally.
- [ ] WYR cards breathe (slow pulse) while waiting for partner.
- [ ] WYR shows 3-beat drumroll for 700ms when partner submits.
- [ ] After drumroll, cards snap into revealed state with slam animation.
- [ ] Match result card bursts in with `animate-wyr-match-burst`.
- [ ] Mismatch result card eases in with `animate-wyr-mismatch-reveal`.
- [ ] All animations collapse to instant fades under `prefers-reduced-motion: reduce`.
- [ ] `npx tsc --noEmit` passes clean.
- [ ] `detectAligned` unit tests: 9 passing.
