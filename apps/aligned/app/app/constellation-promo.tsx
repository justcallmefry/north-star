"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getConstellationSummary } from "@/lib/constellation";
import type { ConstellationSummary } from "@/lib/constellation";
import { getCouplePalette } from "@/lib/couple-colors";

type Props = { relationshipId: string };

/** Decorative mini-sky positions for the promo thumbnail (static, not data). */
const MINI_STARS: Array<{ x: number; y: number; r: number; bright?: boolean }> = [
  { x: 32, y: 40, r: 3, bright: true },
  { x: 14, y: 22, r: 1.5 },
  { x: 48, y: 18, r: 2, bright: true },
  { x: 54, y: 52, r: 1.5 },
  { x: 22, y: 58, r: 2 },
  { x: 42, y: 64, r: 1.2 },
  { x: 10, y: 44, r: 1.2 },
];

export function ConstellationPromo({ relationshipId }: Props) {
  const [summary, setSummary] = useState<ConstellationSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    getConstellationSummary(relationshipId)
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch(() => {
        // Promo is decorative — stay hidden on error.
      });
    return () => {
      cancelled = true;
    };
  }, [relationshipId]);

  // A sky with no stars isn't worth promoting yet.
  if (!summary || summary.stars === 0) return null;

  const palette = getCouplePalette(relationshipId);

  return (
    <Link
      href="/app/constellation"
      className="animate-calm-fade-in flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 transition active:scale-[0.99] hover:border-dusk-300/70"
    >
      <div
        className="flex-shrink-0 overflow-hidden rounded"
        style={{ width: 64, height: 80 }}
        aria-hidden
      >
        <svg
          viewBox="0 0 64 80"
          width={64}
          height={80}
          style={{ background: "linear-gradient(180deg, #0F2740 0%, #060D16 100%)" }}
        >
          <line x1={32} y1={40} x2={48} y2={18} stroke={palette.secondary} strokeOpacity={0.4} strokeWidth={0.7} />
          {MINI_STARS.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill={s.bright ? palette.secondary : "#F5EFE3"}
              opacity={s.bright ? 1 : 0.8}
            />
          ))}
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-dusk-600">
          Your sky
        </p>
        <p className="mt-1 truncate font-display text-base font-semibold text-slate-900">
          {summary.stars} star{summary.stars === 1 ? "" : "s"} and counting
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Every day you both show up adds one.
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
    </Link>
  );
}
