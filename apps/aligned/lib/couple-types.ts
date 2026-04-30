/**
 * Couple type system — v1.
 *
 * Single-axis for now (overall alignment %). Designed to expand to a
 * multi-axis version once we tag Alignment statements with dimensions
 * (e.g., money / planning / closeness / energy).
 */

export type CoupleType = {
  /** Alignment-percent range that triggers this type (inclusive both sides). */
  minPct: number;
  maxPct: number;
  /** Two-word name suitable for "We are: The Echoes". */
  name: string;
  /** One-line tagline for the card. */
  tagline: string;
  /** A short paragraph that goes on the page (not the share card). */
  description: string;
  /** Used for the gradient on the card. */
  gradient: string;
};

export const COUPLE_TYPES: readonly CoupleType[] = [
  {
    minPct: 90,
    maxPct: 100,
    name: "The Echoes",
    tagline: "You think alike — and it shows.",
    description:
      "You almost always land in the same place. That's a real superpower for steady couples — fewer fights about the basics, faster decisions. The work for you two is making sure you stay honest about the small differences, and don't lose them in the agreement.",
    gradient: "from-brand-400 to-brand-600",
  },
  {
    minPct: 75,
    maxPct: 89,
    name: "The Aligned",
    tagline: "Mostly in step, easy to find each other.",
    description:
      "You agree on the big-picture stuff and tend to read each other well. The differences you do have are usually about preferences, not values — which is the comfortable kind. Your edge is learning when a difference is worth a conversation versus a shrug.",
    gradient: "from-emerald-400 to-brand-500",
  },
  {
    minPct: 60,
    maxPct: 74,
    name: "The Bridge",
    tagline: "Different enough to balance, close enough to build.",
    description:
      "You bring real contrast to each other. That's not a problem — it's how some of the strongest couples are wired. Your work is naming the differences early, before they pile up. When you do, you tend to make better decisions together than either of you would alone.",
    gradient: "from-amber-400 to-brand-500",
  },
  {
    minPct: 0,
    maxPct: 59,
    name: "The Spark",
    tagline: "Opposites that keep things interesting.",
    description:
      "You see the world from genuinely different angles. That can be exciting and exhausting in the same day. Your superpower: when you do agree, you've actually convinced each other. Your risk: assuming the other person sees something you see. Spell things out.",
    gradient: "from-violet-400 to-rose-500",
  },
];

export function coupleTypeForAlignmentPct(pct: number): CoupleType {
  const rounded = Math.round(pct);
  return (
    COUPLE_TYPES.find((t) => rounded >= t.minPct && rounded <= t.maxPct) ??
    COUPLE_TYPES[COUPLE_TYPES.length - 1]
  );
}
