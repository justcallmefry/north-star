"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** Normalize a displayed word the same way shared words are extracted. */
export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const WORD_MS = 560; // how long one word takes to rise into place
const TOTAL_STAGGER_MS = 1600; // the whole answer lands within about this
const MIN_STAGGER_MS = 30;
const MAX_STAGGER_MS = 75;
const BEAT_BEFORE_MS = 170; // a shared word waits a beat before landing...
const BEAT_AFTER_MS = 90; // ...and the sentence breathes after it
const LAND_AT = 0.68; // fraction of WORD_MS when a word reads as "landed"

interface Props {
  text: string;
  /** Render everything in place with no motion (revisits). */
  skip?: boolean;
  /** Tokens both partners used. */
  shared?: ReadonlySet<string>;
  /** Shared words land on their own beat, with a highlighter sweep. */
  accentShared?: boolean;
  /** Tokens to light up now (in the answer that was revealed first). */
  lit?: ReadonlySet<string>;
  /** Fired as each shared word lands, so the other answer can light it. */
  onSharedLand?: (token: string, animated: boolean) => void;
  onComplete?: () => void;
}

/**
 * An answer that arrives word by word. Each word rises out of a mask on its
 * own start time, so a sentence lands like a title in a film rather than
 * appearing. All timing is CSS animation-delay: no per-word re-renders,
 * and the full text is in the DOM from the start for screen readers.
 */
export function KineticText({
  text,
  skip,
  shared,
  accentShared,
  lit,
  onSharedLand,
  onComplete,
}: Props) {
  const [reduced, setReduced] = useState(false);
  const callbacks = useRef({ onSharedLand, onComplete });
  callbacks.current = { onSharedLand, onComplete };

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
  }, []);

  const words = useMemo(
    () =>
      text
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => ({ word, token: normalizeWord(word) })),
    [text]
  );

  const { delays, endMs } = useMemo(() => {
    const stagger = Math.min(
      Math.max(TOTAL_STAGGER_MS / Math.max(words.length, 1), MIN_STAGGER_MS),
      MAX_STAGGER_MS
    );
    let t = 0;
    const out: number[] = [];
    for (const { token } of words) {
      const isBeat = accentShared && !!shared?.has(token);
      if (isBeat) t += BEAT_BEFORE_MS;
      out.push(t);
      t += stagger + (isBeat ? BEAT_AFTER_MS : 0);
    }
    const last = out.length ? out[out.length - 1]! : 0;
    return { delays: out, endMs: last + WORD_MS };
  }, [words, shared, accentShared]);

  const animated = !skip && !reduced;

  useEffect(() => {
    const landed = new Set<string>();
    const sharedHits = words
      .map((w, i) => ({ ...w, i }))
      .filter((w) => accentShared && shared?.has(w.token));

    if (!animated) {
      for (const w of sharedHits) {
        if (landed.has(w.token)) continue;
        landed.add(w.token);
        callbacks.current.onSharedLand?.(w.token, false);
      }
      callbacks.current.onComplete?.();
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const w of sharedHits) {
      if (landed.has(w.token)) continue;
      landed.add(w.token);
      timers.push(
        setTimeout(
          () => callbacks.current.onSharedLand?.(w.token, true),
          delays[w.i]! + WORD_MS * LAND_AT
        )
      );
    }
    timers.push(setTimeout(() => callbacks.current.onComplete?.(), endMs));
    return () => timers.forEach(clearTimeout);
  }, [animated, words, delays, endMs, shared, accentShared]);

  return (
    <span className="kinetic-text">
      {words.map(({ word, token }, i) => {
        const isShared = !!shared?.has(token);
        const isLit = !!lit?.has(token);
        const classes = ["kt-word"];
        if (accentShared && isShared) {
          // kt-rise-beat carries its own highlighter sweep.
          classes.push(animated ? "kt-rise-beat" : "kt-marked");
        } else {
          if (animated) classes.push("kt-rise");
          // Listed after kt-rise so the light-up wins once the word has risen.
          if (isLit) classes.push(skip ? "kt-marked" : "kt-lit");
        }
        return (
          <span key={i}>
            <span
              className={classes.join(" ")}
              style={
                animated
                  ? ({ "--kt-delay": `${delays[i]}ms` } as React.CSSProperties)
                  : undefined
              }
            >
              {word}
            </span>
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </span>
  );
}
