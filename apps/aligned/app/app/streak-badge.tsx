"use client";

import { Crown, Flame, Star, Trophy, Zap } from "lucide-react";

const MILESTONES = [
  { min: 30, Icon: Crown, label: "30-day streak" },
  { min: 14, Icon: Star, label: "14-day streak" },
  { min: 7, Icon: Trophy, label: "7-day streak" },
  { min: 3, Icon: Zap, label: "3-day streak" },
  { min: 1, Icon: Flame, label: "1-day streak" },
] as const;

function getMilestone(count: number) {
  return MILESTONES.find((m) => count >= m.min) ?? MILESTONES[MILESTONES.length - 1];
}

/** Human-readable milestone for accessibility. */
function getMilestoneLabel(count: number): string {
  const { label } = getMilestone(count);
  return label;
}

type Props = {
  currentCount: number;
  longestCount?: number;
  /** "compact" = small pill on Today card; "full" = larger after reveal */
  variant?: "compact" | "full";
};

export function StreakBadge({ currentCount, longestCount, variant = "compact" }: Props) {
  if (currentCount < 1) return null;

  const { Icon } = getMilestone(currentCount);
  const milestoneLabel = getMilestoneLabel(currentCount);

  if (variant === "compact") {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200/80"
        title={longestCount != null ? `${milestoneLabel}. Longest: ${longestCount} days` : milestoneLabel}
        aria-label={`${currentCount} day streak`}
      >
        <Icon className="h-4 w-4 text-[#4a9a1c]" strokeWidth={2} aria-hidden />
        <span>
          {currentCount} day{currentCount === 1 ? "" : "s"} in a row, together
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-b from-emerald-50 to-emerald-100/40 px-5 py-4 ring-1 ring-emerald-200/80"
      role="status"
      aria-label={`${currentCount} day streak. ${longestCount != null && longestCount > currentCount ? `Longest: ${longestCount} days.` : ""} Keep it up.`}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
          <Icon className="h-6 w-6 text-[#4a9a1c]" strokeWidth={2} aria-hidden />
        </span>
        <div className="text-left">
          <p className="text-lg font-semibold text-emerald-950">
            {currentCount} day{currentCount === 1 ? "" : "s"} in a row, together
          </p>
          {longestCount != null && longestCount > currentCount && (
            <p className="text-sm text-emerald-800">Longest: {longestCount} days</p>
          )}
        </div>
      </div>
      <p className="text-sm text-emerald-900/90">
        Keep it up — you’re building a habit together. Same time tomorrow?
      </p>
    </div>
  );
}
