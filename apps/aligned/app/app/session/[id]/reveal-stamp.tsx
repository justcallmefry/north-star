type Props = {
  dayNumber?: number | null;
  totalMembers: number;
};

export function RevealStamp({ dayNumber, totalMembers }: Props) {
  const showDay = typeof dayNumber === "number" && dayNumber > 0;
  const subline =
    totalMembers === 2 ? "Both answered" : `All ${totalMembers} answered`;

  return (
    <div className="animate-reveal-stamp flex flex-col items-center gap-1.5 pt-1">
      <div className="flex items-center gap-3">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-brand-300" aria-hidden />
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-brand-700 sm:text-xs">
          {showDay ? <>Day {dayNumber} <span className="text-brand-400">✦</span> {subline}</> : subline}
        </span>
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-brand-300" aria-hidden />
      </div>
    </div>
  );
}
