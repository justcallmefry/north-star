/**
 * Funnel metrics, reconstructed from the domain tables.
 *
 * Everything here is derived from data the app already writes — no event
 * instrumentation, no new tables — which means these numbers are correct
 * *retroactively*, for every couple that has ever used Aligned.
 *
 * Deliberately excluded: anything that would require instrumentation the
 * app doesn't have yet (push open rates, paywall views, share taps). Those
 * are listed in `notInstrumented` rather than silently reported as zero —
 * a metric that reads 0% because nothing records it is worse than no metric.
 *
 * Scale note: this loads active relationships into memory and computes in
 * JS. That is the right trade at beta scale (tens to low thousands of
 * couples). Past that, move the aggregates into SQL.
 */

import { prisma } from "@/lib/prisma";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export type RetentionBucket = {
  /** Couples old enough to be measured at this milestone. */
  cohort: number;
  /** Of those, how many were still revealing on/after day N. */
  retained: number;
  rate: number | null;
};

export type FunnelMetrics = {
  generatedAt: string;
  couples: {
    created: number;
    paired: number;
    pairedWithin72h: number;
    /** paired / created — the metric of the business. */
    pairRate: number | null;
    pairRateWithin72h: number | null;
    medianHoursToPair: number | null;
    /** Created ≥72h ago and still alone: the invites that died. */
    stillUnpairedPast72h: number;
  };
  activation: {
    pairedCouples: number;
    revealedAtLeastOnce: number;
    revealedWithin48h: number;
    /** revealedWithin48h / pairedCouples */
    activationRate: number | null;
    medianHoursToFirstReveal: number | null;
  };
  engagement: {
    activeCouplesLast7d: number;
    revealsLast7d: number;
    /** The health metric. Target ≥ 4. */
    revealsPerActiveCouple: number | null;
  };
  retention: { d7: RetentionBucket; d30: RetentionBucket };
  notInstrumented: string[];
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value =
    sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
  return Math.round(value * 10) / 10;
}

function rate(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export async function getFunnelMetrics(): Promise<FunnelMetrics> {
  const now = Date.now();

  const relationships = await prisma.relationship.findMany({
    where: { status: "active" },
    select: {
      createdAt: true,
      members: {
        where: { leftAt: null },
        select: { joinedAt: true, createdAt: true },
      },
      dailySessions: {
        where: { state: "revealed" },
        select: { updatedAt: true },
      },
    },
  });

  let paired = 0;
  let pairedWithin72h = 0;
  let stillUnpairedPast72h = 0;
  let revealedAtLeastOnce = 0;
  let revealedWithin48h = 0;
  let activeCouplesLast7d = 0;
  let revealsLast7d = 0;

  const hoursToPair: number[] = [];
  const hoursToFirstReveal: number[] = [];
  const d7: RetentionBucket = { cohort: 0, retained: 0, rate: null };
  const d30: RetentionBucket = { cohort: 0, retained: 0, rate: null };

  for (const rel of relationships) {
    // A member's joinedAt is nullable; createdAt is the reliable fallback.
    const memberTimes = rel.members
      .map((m) => (m.joinedAt ?? m.createdAt).getTime())
      .sort((a, b) => a - b);

    const revealTimes = rel.dailySessions
      .map((s) => s.updatedAt.getTime())
      .sort((a, b) => a - b);

    revealsLast7d += revealTimes.filter((t) => now - t <= 7 * DAY_MS).length;
    if (revealTimes.some((t) => now - t <= 7 * DAY_MS)) activeCouplesLast7d++;

    // Not paired yet — the second person never arrived.
    if (memberTimes.length < 2) {
      if (now - rel.createdAt.getTime() > 72 * HOUR_MS) stillUnpairedPast72h++;
      continue;
    }

    paired++;
    const pairedAt = memberTimes[1]!;
    const pairLatency = (pairedAt - rel.createdAt.getTime()) / HOUR_MS;
    hoursToPair.push(Math.max(0, pairLatency));
    if (pairLatency <= 72) pairedWithin72h++;

    const firstReveal = revealTimes[0];
    if (firstReveal !== undefined) {
      revealedAtLeastOnce++;
      const revealLatency = (firstReveal - pairedAt) / HOUR_MS;
      hoursToFirstReveal.push(Math.max(0, revealLatency));
      if (revealLatency <= 48) revealedWithin48h++;
    }

    // Retention: of couples old enough to measure, were they still
    // revealing on or after day N? Streak-independent on purpose — a
    // couple who missed days but came back is retained.
    const ageDays = (now - pairedAt) / DAY_MS;
    for (const [days, bucket] of [
      [7, d7],
      [30, d30],
    ] as const) {
      if (ageDays >= days) {
        bucket.cohort++;
        if (revealTimes.some((t) => t >= pairedAt + days * DAY_MS)) bucket.retained++;
      }
    }
  }

  d7.rate = rate(d7.retained, d7.cohort);
  d30.rate = rate(d30.retained, d30.cohort);

  return {
    generatedAt: new Date(now).toISOString(),
    couples: {
      created: relationships.length,
      paired,
      pairedWithin72h,
      pairRate: rate(paired, relationships.length),
      pairRateWithin72h: rate(pairedWithin72h, relationships.length),
      medianHoursToPair: median(hoursToPair),
      stillUnpairedPast72h,
    },
    activation: {
      pairedCouples: paired,
      revealedAtLeastOnce,
      revealedWithin48h,
      activationRate: rate(revealedWithin48h, paired),
      medianHoursToFirstReveal: median(hoursToFirstReveal),
    },
    engagement: {
      activeCouplesLast7d,
      revealsLast7d,
      revealsPerActiveCouple:
        activeCouplesLast7d === 0
          ? null
          : Math.round((revealsLast7d / activeCouplesLast7d) * 10) / 10,
    },
    retention: { d7, d30 },
    notInstrumented: [
      "Install \u2192 signup rate (needs App Store Connect + an install event)",
      "Push open rate by type (needs a notification-opened event)",
      "Trial \u2192 paid conversion (paywall is disabled; no trials exist yet)",
      "Share cards generated (needs a share event)",
    ],
  };
}
