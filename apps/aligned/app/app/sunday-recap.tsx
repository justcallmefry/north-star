"use client";

import { useEffect, useState } from "react";
import { getSundayRecap } from "@/lib/recap";
import type { SundayRecapResult } from "@/lib/recap";

function getLocalDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isSunday(): boolean {
  return new Date().getDay() === 0;
}

export function SundayRecap({ relationshipId }: { relationshipId: string }) {
  const [recap, setRecap] = useState<SundayRecapResult | null>(null);

  useEffect(() => {
    if (!isSunday()) return;
    getSundayRecap(relationshipId, getLocalDateString()).then(setRecap);
  }, [relationshipId]);

  if (!recap || !isSunday() || recap.answeredDays === 0) return null;

  const { answeredDays, totalDays, bestMatchPrompt, topWords } = recap;

  return (
    <div className="animate-calm-fade-in rounded-2xl border border-peach-300/40 bg-gradient-to-br from-peach-50/80 to-white p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-peach-500" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-peach-600">
          Your week together
        </p>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-slate-900">{answeredDays}</span>
        <span className="text-base text-slate-500">of {totalDays} days answered.</span>
      </div>

      {answeredDays === totalDays && (
        <p className="text-sm font-medium text-brand-700">Perfect week. You showed up every day.</p>
      )}

      {topWords.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">You both kept coming back to</span>
          {topWords.map((w) => (
            <span key={w} className="rounded-full bg-peach-100 px-2.5 py-0.5 text-sm font-semibold text-peach-700">
              {w}
            </span>
          ))}
        </div>
      )}

      {bestMatchPrompt && (
        <div className="rounded-xl border border-peach-100 bg-white/80 px-3.5 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1">
            Best match this week
          </p>
          <p className="text-sm leading-relaxed text-slate-700">{bestMatchPrompt}</p>
        </div>
      )}
    </div>
  );
}
