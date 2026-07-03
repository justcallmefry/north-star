"use server";

import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { requireActiveMember } from "@/lib/relationship-members";
import { detectAligned } from "@/lib/reveal/aligned";
import { milestoneLabel, type StarInput } from "@/lib/constellation-core";
import { isoWeekKey, WEEKLY_REVEAL_TARGET } from "@/lib/week";

export type ConstellationSummary = {
  stars: number;
  kept: number;
};

/**
 * Cheap counts for the Today-screen promo — no responses fetched,
 * no aligned detection.
 */
export async function getConstellationSummary(
  relationshipId: string
): Promise<ConstellationSummary> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  await requireActiveMember(session.user.id, relationshipId);

  const [stars, kept] = await Promise.all([
    prisma.dailySession.count({ where: { relationshipId, state: "revealed" } }),
    prisma.memory.count({ where: { relationshipId, sourceType: "session_reveal" } }),
  ]);
  return { stars, kept };
}

export type ConstellationData = {
  relationshipId: string;
  /** Chronological (oldest first) — feed straight into computeConstellationLayout. */
  stars: StarInput[];
  totals: {
    stars: number;
    aligned: number;
    kept: number;
  };
};

/**
 * Everything the sky needs, derived from history the app already stores.
 * No schema changes: revealed sessions + responses + saved memories.
 */
export async function getConstellation(
  relationshipId: string
): Promise<ConstellationData> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  await requireActiveMember(session.user.id, relationshipId);

  const [sessions, memories, completedDares, appreciations] = await Promise.all([
    prisma.dailySession.findMany({
      where: { relationshipId, state: "revealed" },
      orderBy: { sessionDate: "asc" },
      select: {
        id: true,
        sessionDate: true,
        responses: { select: { content: true } },
      },
    }),
    prisma.memory.findMany({
      where: { relationshipId, sourceType: "session_reveal" },
      select: { sourceId: true },
    }),
    prisma.dateNightDare.findMany({
      where: { relationshipId, completedAt: { not: null } },
      select: { weekKey: true },
    }),
    prisma.appreciation.findMany({
      where: { relationshipId },
      select: { weekKey: true },
    }),
  ]);

  const savedIds = new Set(
    memories.map((m) => m.sourceId).filter((id): id is string => !!id)
  );

  // Golden weeks: enough reveals + the dare done + an appreciation sent,
  // all within the same ISO week. Purely derived — a quiet week costs nothing.
  const revealsByWeek = new Map<string, number>();
  for (const s of sessions) {
    const wk = isoWeekKey(s.sessionDate);
    revealsByWeek.set(wk, (revealsByWeek.get(wk) ?? 0) + 1);
  }
  const dareWeeks = new Set(completedDares.map((d) => d.weekKey));
  const appreciationWeeks = new Set(appreciations.map((a) => a.weekKey));
  const goldenWeeks = new Set(
    [...revealsByWeek.entries()]
      .filter(
        ([wk, count]) =>
          count >= WEEKLY_REVEAL_TARGET && dareWeeks.has(wk) && appreciationWeeks.has(wk)
      )
      .map(([wk]) => wk)
  );

  let alignedCount = 0;
  const stars: StarInput[] = sessions.map((s, i) => {
    const [a, b] = s.responses;
    const aligned =
      a?.content && b?.content ? detectAligned(a.content, b.content) : "none";
    if (aligned !== "none") alignedCount++;
    return {
      id: s.id,
      date: s.sessionDate.toISOString().slice(0, 10),
      aligned,
      saved: savedIds.has(s.id),
      milestone: milestoneLabel(i + 1),
      golden: goldenWeeks.has(isoWeekKey(s.sessionDate)),
    };
  });

  return {
    relationshipId,
    stars,
    totals: {
      stars: stars.length,
      aligned: alignedCount,
      kept: stars.filter((s) => s.saved).length,
    },
  };
}
