import Link from "next/link";
import type { GetTodayResult } from "@/lib/sessions";
import { NotifyPartnerButton } from "./notify-partner-button";

type Props = { today: GetTodayResult | null };

export function TodayCard({ today }: Props) {
  if (!today) {
    return (
      <section className="rounded-2xl border border-pink-100 bg-white p-5 shadow-md shadow-pink-100/80">
        <div className="inline-flex items-center gap-2 rounded-lg bg-pink-50 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-600 sm:text-sm">
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
    <section className="rounded-2xl border border-pink-100 bg-white p-5 shadow-md shadow-pink-100/80">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-lg bg-pink-50 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-600 sm:text-sm">
            Today
          </h2>
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold leading-snug text-slate-900 sm:text-3xl">
        {promptText}
      </p>

      {momentText && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
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
          <>
            <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-lg text-emerald-800">
              Your answer is saved. We&apos;ll reveal when your partner replies.
            </span>
            <Link
              href={`/app/session/${sessionId}`}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-700 shadow-sm hover:border-pink-100 hover:bg-pink-50"
            >
              View my answer
            </Link>
            <NotifyPartnerButton sessionId={sessionId} size="sm" />
          </>
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
