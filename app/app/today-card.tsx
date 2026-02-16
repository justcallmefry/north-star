import Link from "next/link";
import type { GetTodayResult } from "@/lib/sessions";

type Props = { today: GetTodayResult | null };

export function TodayCard({ today }: Props) {
  if (!today) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-lg font-semibold">Today</h2>
        <p className="mt-2 text-sm text-gray-500">No active relationship or no session for today.</p>
      </section>
    );
  }

  const { sessionId, promptText, momentText, state, hasUserResponded, hasPartnerResponded, canReveal } = today;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="text-lg font-semibold">Today</h2>
      <p className="mt-2 text-gray-700 dark:text-gray-300">{promptText}</p>

      {momentText && (
        <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5 dark:border-gray-600/50 dark:bg-gray-800/50">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Optional moment
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{momentText}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {state === "revealed" && (
          <Link
            href={`/app/session/${sessionId}`}
            className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            View today&apos;s session
          </Link>
        )}
        {state === "open" && !hasUserResponded && (
          <Link
            href={`/app/session/${sessionId}`}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Answer today&apos;s question
          </Link>
        )}
        {state === "open" && hasUserResponded && !canReveal && (
          <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
            Your answer is saved. We&apos;ll reveal when your partner replies.
          </span>
        )}
        {state === "open" && canReveal && (
          <Link
            href={`/app/session/${sessionId}`}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Reveal answers
          </Link>
        )}
        {state === "expired" && (
          <span className="text-sm text-gray-500">This session has expired.</span>
        )}
      </div>
    </section>
  );
}
