"use client";

import { useEffect } from "react";
import type { AlignedLevel } from "@/lib/reveal/aligned";
import { haptic } from "@/lib/haptics";

interface Props {
  level: Exclude<AlignedLevel, "none">;
  /** Played live (not a revisit): slam in and buzz. */
  fresh?: boolean;
  /** Wait for the shared-word pills to land first. */
  delayMs?: number;
}

export function AlignedStamp({ level, fresh = false, delayMs = 0 }: Props) {
  const isDeep = level === "deeplyAligned";

  useEffect(() => {
    if (!fresh) return;
    // Buzz as the stamp presses down, roughly 55% into the slam.
    const t = setTimeout(() => {
      void haptic("success");
      if (isDeep) setTimeout(() => void haptic("tap"), 140);
    }, delayMs + 290);
    return () => clearTimeout(t);
  }, [fresh, isDeep, delayMs]);

  return (
    <div className="flex justify-center py-2">
      <span
        className={`${fresh ? "animate-aligned-stamp-slam" : "-rotate-3"} ${
          isDeep
            ? "inline-flex items-center gap-1.5 rounded-full bg-peach-500 px-5 py-2.5 text-base font-semibold text-white shadow-[0_4px_20px_-4px_rgba(224,122,95,0.6)]"
            : "inline-flex items-center gap-1.5 rounded-full bg-peach-300 px-4 py-2 text-sm font-semibold text-dusk-800"
        }`}
        style={fresh ? ({ "--stamp-delay": `${delayMs}ms` } as React.CSSProperties) : undefined}
      >
        <span aria-hidden>✨</span>
        {isDeep ? "deeply aligned" : "aligned"}
      </span>
    </div>
  );
}
