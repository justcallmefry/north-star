import Link from "next/link";
import { CheckCircle, Circle } from "lucide-react";
import type { GetTodayResult } from "@/lib/sessions";
import { getCouplePalette } from "@/lib/couple-colors";
import { DedicationBadge } from "./dedication-badge";
import { NotifyPartnerButton } from "./notify-partner-button";
import { StreakBadge } from "./streak-badge";

type Props = { today: GetTodayResult | null };

export function TodayCard({ today }: Props) {
  if (!today) {
    return (
      <section className="ns-card">
        <div className="inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 sm:text-sm">
            Today
          </h2>
        </div>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">
          No active relationship or no session for today.
        </p>
      </section>
    );
  }

  const { sessionId, relationshipId, promptText, momentText, state, hasUserResponded, hasPartnerResponded, canReveal, streak, dedication } = today;
  const done = hasUserResponded || state === "revealed" || (state === "open" && canReveal);
  const palette = getCouplePalette(relationshipId);

  // Saturday rhythm: a softer visual cue. Doesn't change content yet —
  // a dedicated weekend prompt pool is a follow-up content pass.
  const isSaturday = new Date().getDay() === 6;
  const sectionClass = isSaturday
    ? "relative animate-calm-fade-in rounded-2xl border border-peach-300/40 bg-gradient-to-br from-peach-300/20 via-white to-white p-5 shadow-sm sm:p-6"
    : "relative animate-calm-fade-in rounded-2xl border border-brand-100/80 bg-gradient-to-br from-brand-50/90 to-white p-5 shadow-sm ring-1 ring-brand-50/80 sm:p-6";
  const eyebrowChipClass = isSaturday
    ? "inline-flex items-center gap-2 rounded-lg bg-peach-300/30 px-3 py-1"
    : "inline-flex items-center gap-2 rounded-lg bg-brand-100/80 px-3 py-1";
  const eyebrowDotClass = isSaturday ? "h-1.5 w-1.5 rounded-full bg-peach-500" : "h-1.5 w-1.5 rounded-full bg-brand-500";
  const eyebrowTextClass = isSaturday
    ? "text-xs font-semibold uppercase tracking-[0.18em] text-peach-600 sm:text-sm"
    : "text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 sm:text-sm";
  const eyebrowLabel = isSaturday ? "Saturday — a softer one" : "Today";

  return (
    <section className={sectionClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={eyebrowChipClass}>
          <span className="relative inline-flex items-center justify-center">
            <span
              className="absolute inset-[-3px] rounded-full"
              style={{
                background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primary} 50%, ${palette.secondary} 50%, ${palette.secondary} 100%)`,
                opacity: 0.45,
              }}
              aria-hidden
            />
            <span className={`${eyebrowDotClass} relative`} />
          </span>
          <h2 className={eyebrowTextClass}>{eyebrowLabel}</h2>
        </div>
        {streak && streak.currentCount > 0 && (
          <StreakBadge
            currentCount={streak.currentCount}
            longestCount={streak.longestCount}
            variant="compact"
          />
        )}
      </div>
      {streak && !streak.currentCount && streak.justReset && (
        <p className="mt-2 text-xs font-medium text-amber-800">
          Every day is a fresh start.
        </p>
      )}
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
            Optional moment
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
            View Today&apos;s Answers
          </Link>
        )}
        {state === "open" && !hasUserResponded && (
          <Link
            href={`/app/session/${sessionId}`}
            className="ns-btn-primary block w-full text-center py-3.5 ring-2 ring-brand-300/50 ring-offset-2 ring-offset-white shadow-lg shadow-brand-200/40"
          >
            Answer today&apos;s question
          </Link>
        )}
        {state === "open" && hasUserResponded && !canReveal && (
          <div className="space-y-4">
            <p className="text-center text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              Your answer is saved. We&apos;ll reveal when your partner replies.
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
              className="ns-btn-primary block w-full text-center py-3.5 ring-2 ring-brand-300/50 ring-offset-2 ring-offset-white shadow-lg shadow-brand-200/40"
            >
              Reveal answers
            </Link>
            <p className="text-center text-sm text-slate-500">
              Next question tomorrow.
            </p>
          </div>
        )}
        {state === "expired" && (
          <span className="text-base text-slate-400">This session has expired.</span>
        )}
      </div>
    </section>
  );
}
