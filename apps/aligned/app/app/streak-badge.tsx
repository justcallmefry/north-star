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
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-800 ring-1 ring-amber-200/80"
        title={longestCount != null ? `${milestoneLabel}. Longest: ${longestCount} days` : milestoneLabel}
        aria-label={`${currentCount} day streak`}
      >
        <Icon className="h-4 w-4 text-amber-600" strokeWidth={2} aria-hidden />
        <span>
          {currentCount} day{currentCount === 1 ? "" : "s"} in a row
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-b from-amber-50 to-amber-100/50 px-5 py-4 ring-1 ring-amber-200/80"
      role="status"
      aria-label={`${currentCount} day streak. ${longestCount != null && longestCount > currentCount ? `Longest: ${longestCount} days.` : ""} Keep it up.`}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
        </span>
        <div className="text-left">
          <p className="text-lg font-semibold text-amber-900">
            {currentCount} day{currentCount === 1 ? "" : "s"} in a row
          </p>
          {longestCount != null && longestCount > currentCount && (
            <p className="text-sm text-amber-700">Longest: {longestCount} days</p>
          )}
        </div>
      </div>
      <p className="text-sm text-amber-800/90">
        Keep it up — you’re building a habit together. Same time tomorrow?
      </p>
    </div>
  );
}
