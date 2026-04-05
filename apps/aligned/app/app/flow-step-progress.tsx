"use client";

type Props = {
  /** e.g. "Question 2 of 5" */
  progressTitle: string;
  /** Short line explaining what this round is for */
  phaseDescription: string;
  /** Current step index, 0-based */
  step: number;
  /** Total steps in the bar (e.g. 10 = 5 answers + 5 guesses) */
  totalSteps: number;
  /** Used in the footnote (half of totalSteps) */
  pairCount: number;
};

/**
 * Labeled step progress for quiz / alignment flows so dots are never unexplained.
 */
export function FlowStepProgress({
  progressTitle,
  phaseDescription,
  step,
  totalSteps,
  pairCount,
}: Props) {
  const safeStep = Math.min(Math.max(step, 0), totalSteps - 1);

  return (
    <div
      className="mb-5 rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-3.5 sm:mb-6 sm:px-4 sm:py-4"
      role="region"
      aria-label="Your progress in this activity"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <p
            className="text-base font-semibold leading-snug text-slate-900 sm:text-lg"
            aria-live="polite"
          >
            {progressTitle}
          </p>
          <p className="mt-1 text-sm leading-snug text-slate-600">{phaseDescription}</p>
        </div>
        <p className="shrink-0 self-start rounded-lg bg-white px-2.5 py-1.5 text-center text-xs font-semibold tabular-nums text-slate-800 shadow-sm ring-1 ring-slate-200/90 sm:text-sm">
          Step {safeStep + 1} of {totalSteps}
        </p>
      </div>

      <div
        className="mt-3.5 flex w-full justify-center gap-1.5 sm:gap-2"
        role="group"
        aria-label={`Progress: step ${safeStep + 1} of ${totalSteps}`}
      >
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-2 min-w-[18px] max-w-[32px] flex-1 rounded-full transition-colors duration-200 ${
              i < safeStep
                ? "bg-emerald-500"
                : i === safeStep
                  ? "bg-[#69BE28] ring-2 ring-emerald-600/35 ring-offset-2 ring-offset-slate-50"
                  : "bg-slate-300/95"
            }`}
          />
        ))}
      </div>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-600 sm:text-xs">
        <span className="font-medium text-slate-700">How this works:</span> each dot is one step —{" "}
        <span className="whitespace-nowrap">{pairCount} for your answers</span>, then{" "}
        <span className="whitespace-nowrap">{pairCount} for guesses</span> ({totalSteps} total).
      </p>
    </div>
  );
}
