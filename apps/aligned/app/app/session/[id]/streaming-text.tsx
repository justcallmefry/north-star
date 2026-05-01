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
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
