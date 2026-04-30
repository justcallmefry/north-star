"use client";

import { Heart } from "lucide-react";

type Props = {
  anniversaryISO: string | null;
};

function parseIsoDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function todayInUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Soft chip when an anniversary is set. On the actual anniversary day-of-year,
 * it upgrades to a stronger banner with the year count.
 */
export function AnniversaryBanner({ anniversaryISO }: Props) {
  if (!anniversaryISO) return null;
  const anniversary = parseIsoDate(anniversaryISO);
  if (!anniversary) return null;

  const today = todayInUtc();
  const totalDays = daysBetween(anniversary, today);

  // "Today" is the anniversary if month + day match (same day-of-year).
  const isAnniversaryDay =
    today.getUTCMonth() === anniversary.getUTCMonth() &&
    today.getUTCDate() === anniversary.getUTCDate() &&
    today.getTime() > anniversary.getTime();
  const yearsExact =
    today.getUTCFullYear() - anniversary.getUTCFullYear();

  if (isAnniversaryDay && yearsExact > 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-peach-400 via-peach-500 to-dusk-500 px-5 py-5 text-white shadow-md sm:px-6">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/80">
          Today
        </p>
        <p className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
          Happy {yearsExact}-year anniversary.
        </p>
        <p className="mt-1 text-sm text-white/90 sm:text-base">
          {totalDays.toLocaleString()} days together. Don&apos;t skip today&apos;s question.
        </p>
        <Heart
          className="pointer-events-none absolute right-5 top-5 h-6 w-6 text-white/40"
          aria-hidden
        />
      </div>
    );
  }

  if (totalDays <= 0) return null;

  return (
    <div className="inline-flex items-center gap-2 self-start rounded-full border border-peach-300/50 bg-peach-300/20 px-3 py-1 text-xs font-medium text-peach-600 sm:text-sm">
      <Heart className="h-3.5 w-3.5" aria-hidden />
      <span>Day {totalDays.toLocaleString()} together</span>
    </div>
  );
}
