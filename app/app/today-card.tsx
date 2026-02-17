import Link from "next/link";
import type { GetTodayResult } from "@/lib/sessions";

type Props = { today: GetTodayResult | null };

export function TodayCard({ today }: Props) {
  if (!today) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.9)]">
        <div className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            Today
          </h2>
        </div>
        <p className="mt-3 text-sm text-slate-400 sm:text-base">
          No active relationship or no session for today.
        </p>
      </section>
    );
  }

  const { sessionId, promptText, momentText, state, hasUserResponded, hasPartnerResponded, canReveal } = today;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.9)]">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-lg bg-sky-500/10 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
            Today
          </h2>
        </div>
      </div>
      <p className="mt-3 text-lg leading-relaxed text-slate-50 sm:text-xl">
        {promptText}
      </p>

      {momentText && (
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 sm:text-[13px]">
            Optional moment
          </p>
          <p className="mt-1 text-base leading-relaxed text-slate-200 sm:text-lg">
            {momentText}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {state === "revealed" && (
          <Link
            href={`/app/session/${sessionId}`}
            className="inline-flex items-center rounded-lg bg-slate-100 px-4 py-2 text-base font-semibold text-slate-950 hover:bg-white"
          >
            View today&apos;s session
          </Link>
        )}
        {state === "open" && !hasUserResponded && (
          <Link
            href={`/app/session/${sessionId}`}
            className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-base font-semibold text-emerald-950 shadow-sm shadow-emerald-500/30 hover:bg-emerald-400"
          >
            Answer today&apos;s question
          </Link>
        )}
        {state === "open" && hasUserResponded && !canReveal && (
          <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-base text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
            Your answer is saved. We&apos;ll reveal when your partner replies.
          </span>
        )}
        {state === "open" && canReveal && (
          <Link
            href={`/app/session/${sessionId}`}
            className="inline-flex items-center rounded-lg bg-sky-500 px-4 py-2 text-base font-semibold text-slate-950 shadow-sm shadow-sky-500/30 hover:bg-sky-400"
          >
            Reveal answers
          </Link>
        )}
        {state === "expired" && (
          <span className="text-base text-slate-400">This session has expired.</span>
        )}
      </div>
    </section>
  );
}
