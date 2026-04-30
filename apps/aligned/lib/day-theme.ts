// apps/aligned/lib/day-theme.ts
// 7-day theme map. Each day has restrained tonal classes used by the
// Today card eyebrow + section gradient. The card structure is identical
// across days — only the tints shift.

export type DayThemeKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type DayTheme = {
  key: DayThemeKey;
  /** Visible label in the eyebrow chip (e.g. "Tuesday — appreciation day"). */
  label: string;
  /** Tailwind class for the section background gradient + border. */
  sectionClass: string;
  /** Tailwind class for the eyebrow chip background. */
  eyebrowChipClass: string;
  /** Tailwind class for the eyebrow chip dot. */
  eyebrowDotClass: string;
  /** Tailwind class for the eyebrow chip text. */
  eyebrowTextClass: string;
  /** Which secondary mode (route key) is featured today, if any. */
  featuredMode: "appreciation" | "quiz" | "dare" | "throwback" | "recap" | null;
};

const SUN: DayTheme = {
  key: "sun",
  label: "Sunday — reflection",
  sectionClass:
    "relative animate-calm-fade-in rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 via-white to-white p-5 shadow-sm sm:p-6",
  eyebrowChipClass: "inline-flex items-center gap-2 rounded-lg bg-emerald-100/70 px-3 py-1",
  eyebrowDotClass: "h-1.5 w-1.5 rounded-full bg-emerald-500",
  eyebrowTextClass:
    "text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 sm:text-sm",
  featuredMode: "recap",
};

const MON: DayTheme = {
  key: "mon",
  label: "Monday — light",
  sectionClass:
    "relative animate-calm-fade-in rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-white to-white p-5 shadow-sm sm:p-6",
  eyebrowChipClass: "inline-flex items-center gap-2 rounded-lg bg-amber-100/70 px-3 py-1",
  eyebrowDotClass: "h-1.5 w-1.5 rounded-full bg-amber-500",
  eyebrowTextClass:
    "text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 sm:text-sm",
  featuredMode: null,
};

const TUE: DayTheme = {
  key: "tue",
  label: "Tuesday — appreciation",
  sectionClass:
    "relative animate-calm-fade-in rounded-2xl border border-peach-300/40 bg-gradient-to-br from-peach-300/20 via-white to-white p-5 shadow-sm sm:p-6",
  eyebrowChipClass: "inline-flex items-center gap-2 rounded-lg bg-peach-300/30 px-3 py-1",
  eyebrowDotClass: "h-1.5 w-1.5 rounded-full bg-peach-500",
  eyebrowTextClass:
    "text-xs font-semibold uppercase tracking-[0.18em] text-peach-600 sm:text-sm",
  featuredMode: "appreciation",
};

const WED: DayTheme = {
  key: "wed",
  label: "Wednesday — partner quiz",
  sectionClass:
    "relative animate-calm-fade-in rounded-2xl border border-cyan-200/60 bg-gradient-to-br from-cyan-50/80 via-white to-white p-5 shadow-sm sm:p-6",
  eyebrowChipClass: "inline-flex items-center gap-2 rounded-lg bg-cyan-100/70 px-3 py-1",
  eyebrowDotClass: "h-1.5 w-1.5 rounded-full bg-cyan-500",
  eyebrowTextClass:
    "text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 sm:text-sm",
  featuredMode: "quiz",
};

const THU: DayTheme = {
  key: "thu",
  label: "Thursday — deeper",
  sectionClass:
    "relative animate-calm-fade-in rounded-2xl border border-brand-100/80 bg-gradient-to-br from-brand-50/90 to-white p-5 shadow-sm ring-1 ring-brand-50/80 sm:p-6",
  eyebrowChipClass: "inline-flex items-center gap-2 rounded-lg bg-brand-100/80 px-3 py-1",
  eyebrowDotClass: "h-1.5 w-1.5 rounded-full bg-brand-500",
  eyebrowTextClass:
    "text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 sm:text-sm",
  featuredMode: null,
};

const FRI: DayTheme = {
  key: "fri",
  label: "Friday — date night",
  sectionClass:
    "relative animate-calm-fade-in rounded-2xl border border-orange-200/60 bg-gradient-to-br from-orange-50/80 via-white to-white p-5 shadow-sm sm:p-6",
  eyebrowChipClass: "inline-flex items-center gap-2 rounded-lg bg-orange-100/70 px-3 py-1",
  eyebrowDotClass: "h-1.5 w-1.5 rounded-full bg-orange-500",
  eyebrowTextClass:
    "text-xs font-semibold uppercase tracking-[0.18em] text-orange-700 sm:text-sm",
  featuredMode: "dare",
};

const SAT: DayTheme = {
  key: "sat",
  label: "Saturday — memory",
  sectionClass:
    "relative animate-calm-fade-in rounded-2xl border border-peach-300/40 bg-gradient-to-br from-peach-300/20 via-white to-white p-5 shadow-sm sm:p-6",
  eyebrowChipClass: "inline-flex items-center gap-2 rounded-lg bg-peach-300/30 px-3 py-1",
  eyebrowDotClass: "h-1.5 w-1.5 rounded-full bg-peach-500",
  eyebrowTextClass:
    "text-xs font-semibold uppercase tracking-[0.18em] text-peach-600 sm:text-sm",
  featuredMode: "throwback",
};

const DAY_THEMES: Record<number, DayTheme> = {
  0: SUN,
  1: MON,
  2: TUE,
  3: WED,
  4: THU,
  5: FRI,
  6: SAT,
};

/** JS Date.getDay() returns 0..6 (Sun..Sat). */
export function getDayTheme(date: Date): DayTheme {
  return DAY_THEMES[date.getDay()] ?? THU;
}

/** Convert depthLevel (1..5) to a human estimate. Returns null if unknown. */
export function estimateAnswerTime(depthLevel: number | null | undefined): string | null {
  if (depthLevel == null) return null;
  if (depthLevel <= 2) return "~30s";
  if (depthLevel === 3) return "~1 min";
  return "~2 min";
}

/** Capitalize first letter for category/tone display. */
export function titleCase(s: string | null | undefined): string | null {
  if (!s) return null;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
