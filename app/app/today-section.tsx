"use client";

import { useEffect, useState } from "react";
import { getToday } from "@/lib/sessions";
import type { GetTodayResult } from "@/lib/sessions";
import { TodayCard } from "./today-card";

type Props = { relationshipId: string };

/** Returns YYYY-MM-DD for the user's local date (so "today" rolls at midnight in their timezone). */
function getLocalDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function TodaySection({ relationshipId }: Props) {
  const [today, setToday] = useState<GetTodayResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const localDateStr = getLocalDateString();
    getToday(relationshipId, localDateStr)
      .then((result) => {
        if (!cancelled) {
          setToday(result);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [relationshipId]);

  if (loading) {
    return (
      <section className="ns-card animate-pulse">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="mt-4 h-8 w-full rounded bg-slate-200" />
        <div className="mt-3 h-4 w-3/4 rounded bg-slate-100" />
        <div className="mt-6 h-12 w-full rounded-xl bg-slate-100" />
      </section>
    );
  }

  return <TodayCard today={today} />;
}
