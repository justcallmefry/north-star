"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  to: number;
  /** Total animation duration in ms. Default 800. */
  durationMs?: number;
  /** Suffix appended to the rendered number, e.g. "%". */
  suffix?: string;
  /** Decimal places. Default 0. */
  decimals?: number;
  /** Stable key for sessionStorage dedupe so re-mounts don't re-animate.
   *  When provided, the second visit renders the final value instantly. */
  storageKey?: string;
  className?: string;
};

const STORAGE_PREFIX = "ns:countup-seen:";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function CountUp({
  to,
  durationMs = 800,
  suffix = "",
  decimals = 0,
  storageKey,
  className,
}: Props) {
  const [value, setValue] = useState<number>(() => {
    if (typeof window === "undefined") return to;
    if (!storageKey) return 0;
    try {
      return window.sessionStorage.getItem(STORAGE_PREFIX + storageKey) ? to : 0;
    } catch {
      return 0;
    }
  });
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (startedRef.current) return;
    startedRef.current = true;

    if (storageKey) {
      try {
        if (window.sessionStorage.getItem(STORAGE_PREFIX + storageKey)) {
          setValue(to);
          return;
        }
        window.sessionStorage.setItem(STORAGE_PREFIX + storageKey, "1");
      } catch {
        // ignore
      }
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(to);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      setValue(to * easeOutCubic(t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [to, durationMs, storageKey]);

  return (
    <span className={className}>
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
