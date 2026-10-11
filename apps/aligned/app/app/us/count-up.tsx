"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Runs before paint in the browser, so a revisit never flashes a 0.
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

function readSeen(key: string): number | null {
  try {
    const v = localStorage.getItem(`aligned:seen:${key}`);
    return v == null ? null : Number(v);
  } catch {
    return null;
  }
}
function writeSeen(key: string, value: number) {
  try {
    localStorage.setItem(`aligned:seen:${key}`, String(value));
  } catch {
    // ignore
  }
}
const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);

/**
 * Animates from where this person last saw a value to where it is now, so
 * yesterday's 44 rolls up to 45 instead of every visit replaying from 0.
 * Returns the in-flight value and whether it just went up.
 */
function useSeenTween(storageKey: string, target: number, delayMs: number) {
  const [display, setDisplay] = useState(0);
  const [rose, setRose] = useState(false);
  const raf = useRef<number | null>(null);

  useBeforePaint(() => {
    const seen = readSeen(storageKey);
    const from = seen ?? 0;
    // Unchanged, gone down (a streak broke), reduced motion, or rendered
    // in the background (no frames would run): show the value, no theatre.
    if (from >= target || prefersReduced() || document.hidden) {
      setDisplay(target);
      writeSeen(storageKey, target);
      return;
    }
    setDisplay(from);
    const duration = 650 + Math.min(650, (target - from) * 25);
    let start: number | null = null;
    const timer = setTimeout(() => {
      const step = (now: number) => {
        start ??= now;
        const p = Math.min((now - start) / duration, 1);
        setDisplay(from + (target - from) * easeOut(p));
        if (p < 1) raf.current = requestAnimationFrame(step);
        else {
          writeSeen(storageKey, target);
          if (seen != null) setRose(true); // a real gain, not a first visit
        }
      };
      raf.current = requestAnimationFrame(step);
    }, delayMs);
    return () => {
      clearTimeout(timer);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [storageKey, target, delayMs]);

  return { display, rose };
}

type CountUpProps = {
  value: number;
  /** Stable per stat and relationship, e.g. `${relationshipId}:answered`. */
  storageKey: string;
  delayMs?: number;
  className?: string;
};

export function CountUp({ value, storageKey, delayMs = 0, className }: CountUpProps) {
  const { display, rose } = useSeenTween(storageKey, value, delayMs);
  return (
    <span className={`${className ?? ""} ${rose ? "animate-count-rose" : ""}`} aria-label={String(value)}>
      <span aria-hidden>{Math.round(display)}</span>
    </span>
  );
}

/** Current streak as a share of the best one, filling from where it was. */
export function StreakBar({
  current,
  best,
  storageKey,
  delayMs = 0,
}: {
  current: number;
  best: number;
  storageKey: string;
  delayMs?: number;
}) {
  const { display } = useSeenTween(storageKey, current, delayMs);
  if (best <= 0) return null;
  const pct = Math.min(display / best, 1) * 100;
  const atBest = current >= best && current > 0;
  return (
    <div className="space-y-1.5">
      <div
        className="h-2 overflow-hidden rounded-full bg-brand-100/80"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={best}
        aria-valuenow={current}
        aria-label="Current streak compared with your best"
      >
        <div
          className={`h-full rounded-full ${atBest ? "bg-peach-500" : "bg-brand-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">
        {atBest
          ? "You're at your best streak ever. Every day now is a new record."
          : `${best - current} ${best - current === 1 ? "day" : "days"} to beat your best.`}
      </p>
    </div>
  );
}
