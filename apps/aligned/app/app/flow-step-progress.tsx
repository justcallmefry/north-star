"use client";

type Props = {
  /** e.g. "Question 2 of 5" */
  progressTitle: string;
  /** One short line for this phase (keep brief; repeat users scan title + dots first) */
  phaseDescription: string;
  /** Current step index, 0-based */
  step: number;
  /** Total steps in the bar (e.g. 10 = 5 answers + 5 guesses) */
  totalSteps: number;
};

/**
 * Compact labeled step progress — title, tiny phase hint, fraction badge, dot track.
 */
export function FlowStepProgress({
  progressTitle,
  phaseDescription,
  step,
  totalSteps,
}: Props) {
  const safeStep = Math.min(Math.max(step, 0), totalSteps - 1);

  return (
    <div
      className="mb-3 rounded-lg border border-slate-200/90 bg-slate-50/95 px-2.5 py-2 sm:mb-4 sm:px-3 sm:py-2.5"
      role="region"
      aria-label="Your progress in this activity"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold leading-tight text-slate-900 sm:text-base"
            aria-live="polite"
          >
            {progressTitle}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-600 sm:text-xs">
            {phaseDescription}
          </p>
        </div>
        <span
          className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-slate-700 ring-1 ring-slate-200/90 sm:px-2 sm:text-xs"
          title={`Step ${safeStep + 1} of ${totalSteps}`}
        >
          {safeStep + 1}/{totalSteps}
        </span>
      </div>

      <div
        className="mt-2 flex w-full justify-center gap-1 sm:gap-1.5"
        role="group"
        aria-label={`Progress: step ${safeStep + 1} of ${totalSteps}`}
      >
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 min-w-[14px] max-w-[28px] flex-1 rounded-full transition-colors duration-200 ${
              i < safeStep
                ? "bg-emerald-500"
                : i === safeStep
                  ? "bg-[#69BE28] ring-1 ring-emerald-600/35 ring-offset-1 ring-offset-slate-50"
                  : "bg-slate-300/90"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
