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
  // Set only on client after mount so we never use the server's date (avoids timezone bug
  // where history showed sessions one day behind for users ahead of server TZ).
  const [localDateStr, setLocalDateStr] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize local date on client so it's always the user's calendar day, not the server's.
  useEffect(() => {
    setLocalDateStr(getLocalDateString());
  }, []);

  // Fetch today's session when relationship or local date changes. Skip until we have client date.
  useEffect(() => {
    if (localDateStr == null) return;
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

  // At local midnight, update localDateStr so we refetch and show the new day's question.
  useEffect(() => {
    if (localDateStr == null) return;
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
  }, [localDateStr]);

  if (localDateStr == null || loading) {
    return (
      <section className="ns-card animate-pulse">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="mt-4 h-8 w-full rounded bg-slate-200" />
        <div className="mt-3 h-4 w-2/3 rounded bg-slate-100" />
        <div className="mt-6 h-12 w-full rounded-xl bg-slate-100" />
      </section>
    );
  }

  return <TodayCard today={today} />;
}
