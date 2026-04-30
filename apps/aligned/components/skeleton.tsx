type SkeletonProps = {
  className?: string;
};

/**
 * Shape-matched loading placeholder. Prefer this over a spinner for
 * page-level loading where the eventual content has a known shape —
 * the user perceives "rendering" rather than "loading."
 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`}
      aria-hidden
    />
  );
}

/** Pre-shaped skeleton for an ns-card-style block. */
export function SkeletonCard({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`ns-card space-y-3 ${className}`}
      aria-hidden
      role="status"
      aria-label="Loading"
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}
