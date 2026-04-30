type Props = {
  count: number;
};

const COPY: Record<number, { headline: string; sub: string }> = {
  7: {
    headline: "One week.",
    sub: "Seven days of showing up for each other. The hard part is starting — you started.",
  },
  30: {
    headline: "Thirty days.",
    sub: "A month of small, consistent moments. This is what becomes a rhythm.",
  },
  100: {
    headline: "100 days.",
    sub: "Most couples don't get here. You did. This isn't a streak anymore — it's how you two are.",
  },
  365: {
    headline: "A whole year.",
    sub: "365 days of choosing each other in this small, daily way. That's not a number — that's a record of love.",
  },
};

const FALLBACK = {
  headline: "Another milestone.",
  sub: "Still showing up. That's what it's about.",
};

/** True if `count` is one of the configured threshold milestones. */
export function isStreakMilestone(count: number | null | undefined): boolean {
  if (count == null) return false;
  return count === 7 || count === 30 || count === 100 || count === 365;
}

/**
 * Full-width celebration banner for streak thresholds. Renders ABOVE the
 * standard reveal stamp/answers when the couple has just hit a milestone.
 */
export function StreakCelebration({ count }: Props) {
  const { headline, sub } = COPY[count] ?? FALLBACK;

  return (
    <div className="animate-reveal-stamp relative overflow-hidden rounded-3xl bg-gradient-to-br from-dusk-500 via-dusk-600 to-peach-500 px-5 py-7 text-center text-white shadow-lg sm:px-7 sm:py-8">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/80">
        Day {count} together
      </p>
      <p className="mt-2 font-display text-4xl font-semibold leading-tight sm:text-5xl">
        {headline}
      </p>
      <p className="mx-auto mt-3 max-w-md text-base text-white/90 sm:text-lg">
        {sub}
      </p>
      {/* Soft sparkle motif top-right */}
      <span
        className="pointer-events-none absolute right-5 top-5 text-2xl text-white/40"
        aria-hidden
      >
        ✦
      </span>
    </div>
  );
}
