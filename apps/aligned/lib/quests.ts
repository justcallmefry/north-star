"use server";

import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { requireActiveMember } from "@/lib/relationship-members";
import { isoWeekKey, isoWeekStart, WEEKLY_REVEAL_TARGET } from "@/lib/week";

export type WeeklyQuest = {
  weekKey: string;
  /** Daily questions revealed together this week. */
  reveals: { done: number; target: number };
  /** This week's Date Night Dare completed. */
  dareDone: boolean;
  /** At least one appreciation sent this week (by either of you). */
  appreciationSent: boolean;
  /** All three met — this week's stars are gilded in the sky. */
  golden: boolean;
};

/**
 * The weekly co-op quest, derived entirely from what the couple already
 * does in the app. Framed as an invitation, never an obligation — nothing
 * is lost when a week isn't golden.
 */
export async function getWeeklyQuest(relationshipId: string): Promise<WeeklyQuest> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  await requireActiveMember(session.user.id, relationshipId);

  const now = new Date();
  const weekKey = isoWeekKey(now);
  const weekStart = isoWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const [revealCount, dare, appreciationCount] = await Promise.all([
    prisma.dailySession.count({
      where: {
        relationshipId,
        state: "revealed",
        sessionDate: { gte: weekStart, lt: weekEnd },
      },
    }),
    prisma.dateNightDare.findUnique({
      where: { relationshipId_weekKey: { relationshipId, weekKey } },
      select: { completedAt: true },
    }),
    prisma.appreciation.count({ where: { relationshipId, weekKey } }),
  ]);

  const reveals = { done: Math.min(revealCount, WEEKLY_REVEAL_TARGET), target: WEEKLY_REVEAL_TARGET };
  const dareDone = !!dare?.completedAt;
  const appreciationSent = appreciationCount > 0;

  return {
    weekKey,
    reveals,
    dareDone,
    appreciationSent,
    golden: reveals.done >= reveals.target && dareDone && appreciationSent,
  };
}
