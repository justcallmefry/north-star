"use client";

import { useEffect, useState, useRef } from "react";
import { getToday } from "@/lib/sessions";
import type { GetTodayResult } from "@/lib/sessions";
import { msUntilNextMidnightInTimeZone } from "@/lib/calendar-timezone";
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [loading, setLoading] = useState(true);
  const [localDateStr, setLocalDateStr] = useState<string | null>(null);
  const [deviceTimeZone, setDeviceTimeZone] = useState<string | null | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalDateStr(getLocalDateString());
    try {
      setDeviceTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setDeviceTimeZone(null);
    }
  }, []);

  useEffect(() => {
    if (localDateStr == null || deviceTimeZone === undefined) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getToday(relationshipId, localDateStr, deviceTimeZone)
      .then((result) => {
        if (!cancelled) {
          setToday(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Could not load today’s question.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [relationshipId, localDateStr, deviceTimeZone, retryNonce]);

  const sharedTz = today?.sharedCalendarTimezone ?? null;

  useEffect(() => {
    if (localDateStr == null) return;

    function scheduleNextMidnight() {
      const ms = sharedTz ? msUntilNextMidnightInTimeZone(sharedTz) : msUntilNextMidnight();
      timeoutRef.current = setTimeout(() => {
        setLocalDateStr(getLocalDateString());
        scheduleNextMidnight();
      }, ms);
    }

    scheduleNextMidnight();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [localDateStr, sharedTz]);

  if (localDateStr == null || deviceTimeZone === undefined || loading) {
    return (
      <section className="ns-card motion-safe:animate-pulse">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="mt-4 h-8 w-full rounded bg-slate-200" />
        <div className="mt-3 h-4 w-2/3 rounded bg-slate-100" />
        <div className="mt-6 h-12 w-full rounded-xl bg-slate-100" />
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="ns-card border-red-100 bg-red-50/50">
        <p className="text-sm text-red-800">{loadError}</p>
        <button
          type="button"
          className="ns-btn-secondary mt-4 w-full py-2.5 text-sm font-semibold"
          onClick={() => setRetryNonce((n) => n + 1)}
        >
          Try again
        </button>
      </section>
    );
  }

  return <TodayCard today={today} />;
}
