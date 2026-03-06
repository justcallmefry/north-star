"use client";

import { Heart } from "lucide-react";

type Props = {
  totalCheckIns: number;
  /** "compact" = small line on Today card; "full" = slightly larger after reveal */
  variant?: "compact" | "full";
};

export function DedicationBadge({ totalCheckIns, variant = "compact" }: Props) {
  if (totalCheckIns < 1) return null;

  const label =
    totalCheckIns === 1
      ? "1 daily check-in"
      : `${totalCheckIns} daily check-ins`;

  if (variant === "compact") {
    return (
      <p
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600"
        title={`You've done ${label} in this relationship`}
        aria-label={`You've done ${label}`}
      >
        <Heart className="h-3.5 w-3.5 text-rose-400" strokeWidth={2} aria-hidden />
        <span>You&apos;ve done {label}</span>
      </p>
    );
  }

  return (
    <p
      className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200/80"
      role="status"
      aria-label={`You've done ${label}. Your dedication doesn't reset.`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
        <Heart className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
      <span>You&apos;ve done {label} — your dedication keeps growing.</span>
    </p>
  );
}
