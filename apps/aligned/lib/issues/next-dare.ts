import type { IssueSection } from "./types";
import { getDareCopy } from "../dare";
import { prisma as defaultPrisma } from "@/lib/prisma";

/**
 * Returns the dare queued for next week (the ISO week starting on
 * `nextMondayStart`). Looks up by `weekKey`. If none exists, returns null.
 */
export async function pickNextDare(
  prisma: typeof defaultPrisma,
  relationshipId: string,
  nextMondayStart: Date
): Promise<Extract<IssueSection, { kind: "nextDare" }> | null> {
  const weekKey = isoWeekKey(nextMondayStart);
  const next = await prisma.dateNightDare.findUnique({
    where: { relationshipId_weekKey: { relationshipId, weekKey } },
  });
  if (!next) return null;

  const copy = await getDareCopy(next.dareIndex);
  if (!copy) return null;

  return {
    kind: "nextDare",
    title: copy.title,
    description: copy.description,
    duration: copy.duration,
  };
}

function isoWeekKey(d: Date): string {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
