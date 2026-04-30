"use client";

import { useEffect, useState } from "react";
import { getWeekActivity } from "@/lib/sessions";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getLocalDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 7-dot week view showing which days this couple completed the daily question. */
export function ConnectionDots({ relationshipId }: { relationshipId: string }) {
  const [days, setDays] = useState<{ date: string; completed: boolean }[] | null>(null);

  useEffect(() => {
    const dateStr = getLocalDateString();
    getWeekActivity(relationshipId, dateStr).then((r) => setDays(r.days));
  }, [relationshipId]);

  if (!days) return null;

  const completedCount = days.filter((d) => d.completed).length;

  return (
    <div className="flex flex-col items-center gap-2 py-1">
      <div className="flex items-center gap-1.5">
        {days.map((day, i) => {
          const label = DAY_LABELS[new Date(day.date + "T12:00:00Z").getUTCDay() === 0 ? 6 : new Date(day.date + "T12:00:00Z").getUTCDay() - 1] ?? "";
          return (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <div
                className={`h-3 w-3 rounded-full transition-all ${
                  day.completed
                    ? "bg-brand-500 shadow-sm shadow-brand-200"
                    : i === days.length - 1
                      ? "bg-slate-200 ring-2 ring-brand-200 ring-offset-1"
                      : "bg-slate-200"
                }`}
                aria-label={`${day.date}: ${day.completed ? "completed" : "not completed"}`}
              />
              <span className="text-[9px] font-medium text-slate-400">{label}</span>
            </div>
          );
        })}
      </div>
      {completedCount > 0 && (
        <p className="text-xs text-slate-500">
          {completedCount === 7
            ? "Perfect week together."
            : `${completedCount} of 7 days this week.`}
        </p>
      )}
    </div>
  );
}
