import Link from "next/link";
import { CheckCircle, Circle } from "lucide-react";
import type { GetTodayResult } from "@/lib/sessions";
import { DedicationBadge } from "./dedication-badge";
import { NotifyPartnerButton } from "./notify-partner-button";
import { StreakBadge } from "./streak-badge";
import { ConnectionDots } from "./connection-dots";
import { getDayTheme, estimateAnswerTime, titleCase } from "@/lib/day-theme";

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

  const {
    sessionId,
    relationshipId,
    promptText,
    momentText,
    state,
    hasUserResponded,
    hasPartnerResponded,
    canReveal,
    streak,
    dedication,
    partnerName,
    category,
    tone,
    depthLevel,
  } = today;
  const done = hasUserResponded || state === "revealed" || (state === "open" && canReveal);

  const theme = getDayTheme(new Date());
  const time = estimateAnswerTime(depthLevel ?? null);
  const cat = titleCase(category ?? null);
  const ton = titleCase(tone ?? null);
  const metaParts = [cat, ton, time].filter(Boolean) as string[];

  return (
    <section className={theme.sectionClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={`${theme.eyebrowChipClass} min-w-0`}>
          <span className={theme.eyebrowDotClass} />
          <h2 className={theme.eyebrowTextClass}>{theme.label}</h2>
        </div>
        {streak && streak.currentCount > 0 && (
          <StreakBadge
            currentCount={streak.currentCount}
            longestCount={streak.longestCount}
            variant="compact"
          />
        )}
      </div>
      {metaParts.length > 0 && (
        <p className="mt-2 text-xs text-slate-500 sm:text-sm">
          {metaParts.map((p, i) => (
            <span key={p}>
              {i > 0 && <span className="mx-1.5 text-slate-300">·</span>}
              {p}
            </span>
          ))}
        </p>
      )}
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
      <div className="mt-3">
        <ConnectionDots relationshipId={relationshipId} />
      </div>
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
            className="ns-btn-primary block w-full text-center py-3.5 transition active:scale-[0.98]"
          >
            View Today&apos;s Answers
          </Link>
        )}
        {state === "open" && !hasUserResponded && hasPartnerResponded && (
          <div className="space-y-3 w-full">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />
              </span>
              <p className="text-sm font-medium text-brand-700">
                They answered — they&apos;re waiting on you.
              </p>
            </div>
            <Link
              href={`/app/session/${sessionId}`}
              className="ns-btn-primary block w-full text-center py-3.5 ring-2 ring-brand-300/50 ring-offset-2 ring-offset-white shadow-lg shadow-brand-200/40 transition active:scale-[0.98]"
            >
              Answer now
            </Link>
          </div>
        )}
        {state === "open" && !hasUserResponded && !hasPartnerResponded && (
          <Link
            href={`/app/session/${sessionId}`}
            className="ns-btn-primary block w-full text-center py-3.5 ring-2 ring-brand-300/50 ring-offset-2 ring-offset-white shadow-lg shadow-brand-200/40 transition active:scale-[0.98]"
          >
            Answer today&apos;s question
          </Link>
        )}
        {state === "open" && hasUserResponded && !canReveal && (
          <div className="space-y-4 w-full">
            <p className="text-center text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              Your answer is sealed. 🔒 We&apos;ll reveal the moment they reply.
            </p>
            <div className="flex flex-col gap-2">
              <Link href={`/app/session/${sessionId}`} className="ns-btn-primary block w-full text-center py-3.5 transition active:scale-[0.98]">
                View my answer
              </Link>
              <NotifyPartnerButton sessionId={sessionId} relationshipId={relationshipId} partnerName={partnerName} variant="secondary" className="w-full py-3.5" />
            </div>
          </div>
        )}
        {state === "open" && canReveal && (
          <div className="space-y-2 w-full">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
              Both in
            </p>
            <Link
              href={`/app/session/${sessionId}`}
              className="ns-btn-primary block w-full text-center py-3.5 ring-2 ring-brand-300/50 ring-offset-2 ring-offset-white animate-reveal-ready-breathe transition active:scale-[0.98]"
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
