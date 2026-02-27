import Link from "next/link";
import type { GetTodayResult } from "@/lib/sessions";
import { NotifyPartnerButton } from "./notify-partner-button";

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

  const { sessionId, promptText, momentText, state, hasUserResponded, hasPartnerResponded, canReveal } = today;

  return (
    <section className="animate-calm-fade-in rounded-2xl border border-brand-100/80 bg-gradient-to-br from-brand-50/90 to-white p-5 shadow-sm ring-1 ring-brand-50/80 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-lg bg-brand-100/80 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 sm:text-sm">
            Today
          </h2>
        </div>
      </div>
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
            className="ns-btn-secondary"
          >
            View today&apos;s session
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
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/app/session/${sessionId}`} className="ns-btn-primary">
                View my answer
              </Link>
              <NotifyPartnerButton sessionId={sessionId} variant="secondary" />
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
