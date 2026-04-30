"use client";

import { useEffect, useRef, useState } from "react";
import { getTodayWithVariant } from "@/lib/sessions";
import type { TodayResponse } from "@/lib/sessions";
import { TodayCard } from "./today-card";
import { TodayThrowbackCard } from "./today-throwback-card";
import { TodaySkeleton } from "./today-skeleton";

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
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  // Set only on client after mount so we never use the server's date (avoids timezone bug
  // where history showed sessions one day behind for users ahead of server TZ).
  const [localDateStr, setLocalDateStr] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalDateStr(getLocalDateString());
  }, []);

  useEffect(() => {
    if (localDateStr == null) return;
    let cancelled = false;
    setLoading(true);
    getTodayWithVariant(relationshipId, localDateStr)
      .then((result) => {
        if (!cancelled) setData(result);
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

  if (localDateStr == null || loading || data == null) {
    return <TodaySkeleton />;
  }

  if (data.variant === "throwback") {
    return (
      <TodayThrowbackCard
        throwback={data.throwback}
        localDateStr={localDateStr}
      />
    );
  }
  return <TodayCard today={data.today} />;
}
