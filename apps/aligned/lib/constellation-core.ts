/**
 * Pure layout math for the Couple Constellation — no DB, no auth.
 * Stars sit on a Fermat spiral (golden-angle phyllotaxis) with small
 * deterministic jitter, so the sky grows outward organically from day one
 * and the same history always renders the same sky.
 */

import type { AlignedLevel } from "@/lib/reveal/aligned";

/** Golden angle in radians (137.508°). */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Radial distance between spiral rings, in viewBox units. */
const RADIUS_SCALE = 22;

/** Padding around the outermost star, in viewBox units. */
const VIEW_PADDING = 40;

/** Max index distance between consecutive aligned stars that still links them. */
const LINK_MAX_GAP = 7;

export type StarInput = {
  /** Stable id (session id) — used for links + jitter seeding. */
  id: string;
  /** YYYY-MM-DD of the reveal. */
  date: string;
  aligned: AlignedLevel;
  /** True when this reveal was saved to the memory timeline. */
  saved: boolean;
  /** Milestone label for this check-in ("One week", …) or null. */
  milestone: string | null;
  /** True when this star's week was a golden week (weekly quest complete). */
  golden?: boolean;
};

export type PositionedStar = StarInput & {
  index: number;
  x: number;
  y: number;
  /** Visual radius in viewBox units. */
  r: number;
  /** "base" | "aligned" | "deeplyAligned" | "milestone" — drives color/glow. */
  tier: "base" | "aligned" | "deeplyAligned" | "milestone";
};

export type StarLink = {
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type ConstellationLayout = {
  stars: PositionedStar[];
  links: StarLink[];
  /** SVG viewBox — centered on the spiral origin. */
  viewBox: { minX: number; minY: number; width: number; height: number };
};

/** Milestone labels by total check-in count (dedication-based, never resets). */
const MILESTONE_LABELS: Record<number, string> = {
  7: "One week",
  30: "Thirty days",
  100: "One hundred",
  365: "A whole year",
};

/** Label for the Nth total reveal (1-based), or null. */
export function milestoneLabel(checkInNumber: number): string | null {
  return MILESTONE_LABELS[checkInNumber] ?? null;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic jitter in [-1, 1) from an id + salt. */
function jitter(id: string, salt: string): number {
  return ((hashStr(id + salt) % 1000) / 500) - 1;
}

function tierOf(star: StarInput): PositionedStar["tier"] {
  if (star.milestone) return "milestone";
  if (star.aligned === "deeplyAligned") return "deeplyAligned";
  if (star.aligned === "aligned") return "aligned";
  return "base";
}

const TIER_RADIUS: Record<PositionedStar["tier"], number> = {
  base: 2.5,
  aligned: 4,
  deeplyAligned: 5.5,
  milestone: 7,
};

/**
 * Lay out stars on the spiral. Input order = chronological (oldest first);
 * the oldest star sits at the center of the sky.
 */
export function computeConstellationLayout(inputs: StarInput[]): ConstellationLayout {
  const stars: PositionedStar[] = inputs.map((star, index) => {
    const angle = index * GOLDEN_ANGLE + jitter(star.id, "a") * 0.35;
    const radius =
      index === 0 ? 0 : RADIUS_SCALE * Math.sqrt(index) + jitter(star.id, "r") * 6;
    const tier = tierOf(star);
    return {
      ...star,
      index,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      r: TIER_RADIUS[tier],
      tier,
    };
  });

  // Link consecutive aligned/milestone stars that are close in time —
  // little constellations emerge from runs of alignment.
  const linkable = stars.filter((s) => s.tier !== "base");
  const links: StarLink[] = [];
  for (let i = 1; i < linkable.length; i++) {
    const prev = linkable[i - 1]!;
    const curr = linkable[i]!;
    if (curr.index - prev.index <= LINK_MAX_GAP) {
      links.push({
        fromId: prev.id,
        toId: curr.id,
        x1: prev.x,
        y1: prev.y,
        x2: curr.x,
        y2: curr.y,
      });
    }
  }

  const maxExtent = stars.reduce(
    (m, s) => Math.max(m, Math.abs(s.x) + s.r, Math.abs(s.y) + s.r),
    RADIUS_SCALE * 2
  );
  const half = maxExtent + VIEW_PADDING;

  return {
    stars,
    links,
    viewBox: { minX: -half, minY: -half, width: half * 2, height: half * 2 },
  };
}
