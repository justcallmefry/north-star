"use server";

import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { requireActiveMember } from "@/lib/relationship-members";
import { detectAligned } from "@/lib/reveal/aligned";
import { milestoneLabel, type StarInput } from "@/lib/constellation-core";

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

  const [sessions, memories] = await Promise.all([
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
  ]);

  const savedIds = new Set(
    memories.map((m) => m.sourceId).filter((id): id is string => !!id)
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
