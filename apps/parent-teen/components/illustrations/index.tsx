"use client";

/**
 * Inline SVG illustrations you can use from code—no image files.
 * All use the app palette (blue/slate). Pass className for size.
 */

type IllustrationProps = {
  className?: string;
  /** Override accent color (default: brand blue) */
  accent?: string;
};

/** Two figures with a small heart between them. Use for empty state or "create/join". */
export function EmptyTogetherIllustration({ className = "w-32 h-32", accent = "#9333ea" }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Left figure (circle head + simple body) */}
      <circle cx="32" cy="24" r="12" fill="#e2e8f0" />
      <path d="M32 38 v24 l-8 18 m0 0 l8 -6 m-8 6 l16 0" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Right figure */}
      <circle cx="88" cy="24" r="12" fill="#e2e8f0" />
      <path d="M88 38 v24 l8 18 m0 0 l-8 -6 m8 6 l-16 0" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Small heart between them */}
      <path
        d="M56 52 c0 -4 4 -8 8 -8 s8 4 8 8 c0 6 -8 14 -16 14 s-16 -8 -16 -14 z"
        fill={accent}
        opacity={0.9}
      />
    </svg>
  );
}

/** Simple "moment" — two overlapping circles (connection) and a soft glow. Use after reveal or on Today. */
export function MomentIllustration({ className = "w-24 h-24", accent = "#9333ea" }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="40" cy="40" r="36" fill="#fdf2f8" opacity={0.6} />
      <circle cx="34" cy="40" r="14" fill="#e2e8f0" />
      <circle cx="46" cy="40" r="14" fill="#e2e8f0" />
      <circle cx="40" cy="40" r="8" fill={accent} opacity={0.8} />
    </svg>
  );
}

/** Minimal "daily" — single figure with a small sparkle. Use on Today card or prompts. */
export function DailySparkIllustration({ className = "w-20 h-20", accent = "#9333ea" }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="32" cy="28" r="14" fill="#e2e8f0" />
      <path d="M32 44 v16 l-6 8 m0 0 l6 -4 m-6 4 l12 0" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="48" cy="22" r="4" fill={accent} opacity={0.9} />
    </svg>
  );
}
