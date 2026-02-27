"use client";

import { useEffect, useState, useRef } from "react";
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

/** Milliseconds until the next local midnight. */
function msUntilNextMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return tomorrow.getTime() - now.getTime();
}

export function TodaySection({ relationshipId }: Props) {
  const [today, setToday] = useState<GetTodayResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [localDateStr, setLocalDateStr] = useState(getLocalDateString);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch today's session when relationship or local date changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
  }, [relationshipId, localDateStr]);

  // At local midnight, update localDateStr so we refetch and show the new day's quiz.
  useEffect(() => {
    function scheduleNextMidnight() {
      const ms = msUntilNextMidnight();
      timeoutRef.current = setTimeout(() => {
        setLocalDateStr(getLocalDateString());
        scheduleNextMidnight();
      }, ms);
    }
    scheduleNextMidnight();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
