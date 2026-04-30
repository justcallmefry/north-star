type Props = {
  /** Small left-side eyebrow, e.g., "Day 23". When omitted, only the headline shows. */
  eyebrow?: string | null;
  /** Headline shown after the eyebrow. Defaults to "Both answered" / "All N answered". */
  headline?: string | null;
  /** Used to compute the default headline if `headline` is not provided. */
  totalMembers?: number;
};

export function RevealStamp({ eyebrow, headline, totalMembers = 2 }: Props) {
  const resolvedHeadline =
    headline ??
    (totalMembers === 2 ? "Both answered" : `All ${totalMembers} answered`);
  const showEyebrow = typeof eyebrow === "string" && eyebrow.trim().length > 0;

  return (
    <div className="animate-reveal-stamp flex flex-col items-center gap-1.5 pt-1">
      <div className="flex items-center gap-3">
        <span
          className="h-px w-10 bg-gradient-to-r from-transparent to-brand-300"
          aria-hidden
        />
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-brand-700 sm:text-xs">
          {showEyebrow ? (
            <>
              {eyebrow} <span className="text-brand-400">✦</span> {resolvedHeadline}
            </>
          ) : (
            resolvedHeadline
          )}
        </span>
        <span
          className="h-px w-10 bg-gradient-to-l from-transparent to-brand-300"
          aria-hidden
        />
      </div>
    </div>
  );
}
