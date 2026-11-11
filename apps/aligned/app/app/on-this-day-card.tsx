"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOnThisDay, type OnThisDay } from "@/lib/on-this-day";

function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Resurfaces a day from your past and opens it in the sky. */
export function OnThisDayCard() {
  const [day, setDay] = useState<OnThisDay | null>(null);

  useEffect(() => {
    let live = true;
    getOnThisDay(localDate())
      .then((d) => live && setDay(d))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (!day) return null;

  return (
    <Link
      href={`/app/constellation?focus=${day.sessionId}`}
      className="animate-calm-fade-in block rounded-2xl border border-[#E4B95B]/40 bg-gradient-to-br from-[#FFF8E8] to-[#FFFDF8] p-4 transition active:scale-[0.99]"
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#A8792A]">✦ {day.label}</p>
      {day.promptText && (
        <p className="mt-1.5 line-clamp-2 font-prompt text-base leading-snug text-slate-900">{day.promptText}</p>
      )}
      <p className="mt-1 text-xs text-slate-500">See what you both said, in your sky →</p>
    </Link>
  );
}
