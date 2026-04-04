import Link from "next/link";
import { CheckCircle, Circle } from "lucide-react";
import type { GetTodayResult } from "@/lib/sessions";
import { DedicationBadge } from "./dedication-badge";
import { NotifyPartnerButton } from "./notify-partner-button";
import { StreakBadge } from "./streak-badge";

type Props = { today: GetTodayResult | null };

export function TodayCard({ today }: Props) {
  if (!today) {
    return (
      <section className="ns-card">
        <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1 ring-1 ring-emerald-200/60">
          <span className="h-1.5 w-1.5 rounded-full bg-[#69BE28]" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 sm:text-sm">
            Today&apos;s question
          </h2>
        </div>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">
          We couldn&apos;t load today&apos;s question yet—or you haven&apos;t paired with your partner.
        </p>
        <Link href="/app/pair" className="ns-btn-primary mt-4 block w-full py-3 text-center text-sm">
          Pair or get invite link
        </Link>
      </section>
    );
  }

  const { sessionId, relationshipId, promptText, momentText, state, hasUserResponded, hasPartnerResponded, canReveal, streak, dedication } = today;
  const done = hasUserResponded || state === "revealed" || (state === "open" && canReveal);

  return (
    <section className="relative animate-calm-fade-in rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 via-[#f0f7f2] to-[#f6faf7] p-5 shadow-sm ring-1 ring-emerald-100/70 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-100/90 px-3 py-1 ring-1 ring-emerald-200/60">
          <span className="h-1.5 w-1.5 rounded-full bg-[#69BE28]" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900 sm:text-sm">
            Today&apos;s question
          </h2>
        </div>
      </div>
      {dedication && dedication.totalCheckIns > 0 && (
        <div className="mt-2">
          <DedicationBadge totalCheckIns={dedication.totalCheckIns} variant="compact" />
        </div>
      )}
      <span
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm"
        aria-hidden
      >
        {done ? (
          <CheckCircle className="h-6 w-6 text-emerald-600" strokeWidth={2} aria-label="Done today" />
        ) : (
          <Circle className="h-6 w-6 text-slate-300" strokeWidth={2} aria-label="Not done today" />
        )}
      </span>
      <p className="mt-3 text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
        {promptText}
      </p>

      {momentText && (
        <div className="ns-card-inner mt-3 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 sm:text-[13px]">
            If you want to go a little further
          </p>
          <p className="mt-1 text-lg leading-relaxed text-slate-700 sm:text-xl">
            {momentText}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {state === "revealed" && (
          <Link
            href={`/app/session/${sessionId}`}
            className="ns-btn-primary block w-full text-center py-3.5"
          >
            See today&apos;s answers
          </Link>
        )}
        {state === "open" && !hasUserResponded && (
          <Link
            href={`/app/session/${sessionId}`}
            className="ns-btn-primary block w-full text-center py-3.5 ring-2 ring-brand-300/50 ring-offset-2 ring-offset-[#f6faf7] shadow-lg shadow-brand-200/40"
          >
            Answer privately
          </Link>
        )}
        {state === "open" && hasUserResponded && !canReveal && (
          <div className="space-y-4">
            <p className="text-center text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              Your answer is saved. Locked until they reply—then you unlock together.
            </p>
            <div className="flex flex-col gap-2">
              <Link href={`/app/session/${sessionId}`} className="ns-btn-primary block w-full text-center py-3.5">
                View my answer
              </Link>
              <NotifyPartnerButton sessionId={sessionId} relationshipId={relationshipId} variant="secondary" className="w-full py-3.5" />
            </div>
          </div>
        )}
        {state === "open" && canReveal && (
          <div className="space-y-2">
            <Link
              href={`/app/session/${sessionId}`}
              className="ns-btn-primary block w-full text-center py-3.5 ring-2 ring-brand-300/50 ring-offset-2 ring-offset-[#f6faf7] shadow-lg shadow-brand-200/40"
            >
              Open our answers
            </Link>
            <p className="text-center text-sm text-slate-500">
              A fresh question waits tomorrow.
            </p>
          </div>
        )}
        {state === "expired" && (
          <span className="text-base text-slate-400">This session has expired.</span>
        )}
      </div>

      {/* Streak info: shown just below the main action / notify area */}
      {streak && (
        <div className="mt-4 space-y-2">
          {streak.currentCount > 0 && (
            <div className="flex justify-center">
              <StreakBadge
                currentCount={streak.currentCount}
                longestCount={streak.longestCount}
                variant="compact"
              />
            </div>
          )}
          {!streak.currentCount && streak.justReset && (
            <p className="text-center text-xs font-medium text-emerald-800">
              Every day is a fresh start.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
