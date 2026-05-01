import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { buildWeeklyIssue } from "./templates/weekly";
import { weekWindowFor } from "./window";

export async function generateWeeklyIssueForRelationship(args: {
  relationshipId: string;
  now: Date;
  isPremium: boolean;
}): Promise<{ created: boolean; skipped: boolean; reason?: string; issueId?: string }> {
  const { relationshipId, now, isPremium } = args;

  const { start, end, weekKey } = weekWindowFor(now);

  const priorCount = await prisma.issue.count({
    where: { relationshipId, cadence: "weekly" },
  });
  const issueNumber = priorCount + 1;

  const existing = await prisma.issue.findUnique({
    where: {
      relationshipId_cadence_issueNumber: {
        relationshipId,
        cadence: "weekly",
        issueNumber,
      },
    },
  });
  if (existing) return { created: false, skipped: true, reason: "exists" };

  const built = await buildWeeklyIssue({ relationshipId, start, end, weekKey });
  if (!built) return { created: false, skipped: true, reason: "insufficient-data" };

  const created = await prisma.issue.create({
    data: {
      relationshipId,
      cadence: "weekly",
      issueNumber,
      volumeNumber: 1,
      windowStart: start,
      windowEnd: end,
      headline: built.headline,
      coverPhotoUrl: built.coverPhotoUrl,
      coverGradient: (built.coverGradient ?? undefined) as Prisma.InputJsonValue | undefined,
      sections: built.sections as unknown as Prisma.InputJsonValue,
      isPremium,
    },
    select: { id: true },
  });

  return { created: true, skipped: false, issueId: created.id };
}

/**
 * Iterate all active relationships and generate where appropriate.
 * Phase 1: treats every Sunday at the cron tick as eligible (no per-user
 * timezone yet). Idempotency keeps repeat-runs safe — only the first
 * successful run creates each issue.
 */
export async function generateAllWeeklyIssues(now: Date): Promise<{ created: number; skipped: number }> {
  if (now.getUTCDay() !== 0) return { created: 0, skipped: 0 };

  const rels = await prisma.relationship.findMany({
    where: { status: "active" },
    select: { id: true },
  });

  let created = 0;
  let skipped = 0;
  for (const rel of rels) {
    const r = await generateWeeklyIssueForRelationship({
      relationshipId: rel.id,
      now,
      isPremium: false, // Phase 1: no gating yet (Phase 3 introduces premium)
    });
    if (r.created) created++;
    else skipped++;
  }
  return { created, skipped };
}
