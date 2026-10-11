"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { getMyRecapTeaser, type RecapTeaser } from "@/lib/weekly-recap-actions";

/** Today-screen entry to "Your week together". Hidden until there's a week worth showing. */
export function RecapPromo() {
  const [teaser, setTeaser] = useState<RecapTeaser | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyRecapTeaser()
      .then((t) => !cancelled && setTeaser(t))
      .catch(() => {
        // Decorative; stay hidden on error.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!teaser) return null;

  return (
    <Link
      href="/app/recap"
      className="animate-calm-fade-in flex items-center gap-4 rounded-2xl border border-dusk-200/60 bg-gradient-to-br from-[#14304D] to-[#0B1B2E] p-3 text-white transition active:scale-[0.99]"
    >
      <span className="relative flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#060D16] ring-1 ring-white/10">
        <span className="absolute left-2 top-3 h-1 w-1 rounded-full bg-white/70" aria-hidden />
        <span className="absolute right-3 top-6 h-0.5 w-0.5 rounded-full bg-white/60" aria-hidden />
        <span className="absolute bottom-4 left-4 h-1 w-1 rounded-full bg-[#FFD9A8]" aria-hidden />
        <Play className="h-5 w-5 fill-white/90 text-white/90" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#F2966E]">
          Your week together
        </span>
        <span className="mt-1 block truncate font-display text-base font-semibold">
          {teaser.daysTogether} of 7 days
          {teaser.topWord ? (
            <>
              {" · "}
              <em className="font-prompt">&ldquo;{teaser.topWord}&rdquo;</em>
            </>
          ) : null}
        </span>
        <span className="mt-0.5 block text-xs text-white/55">15 seconds · Watch and share</span>
      </span>
    </Link>
  );
}
