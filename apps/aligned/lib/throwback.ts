// apps/aligned/lib/throwback.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/relationship-members";
import { getServerAuthSession } from "@/lib/auth";

const MIN_AGE_DAYS = 30;
const SATURDAY = 6;
/** Of the eligible Saturdays, this fraction shows the throwback variant. */
const THROWBACK_SHARE = 0.5;

type StoredSnapshot = {
  kind?: string;
  promptText?: string | null;
  responses?: Array<{ userId: string; name: string | null; content: string | null }>;
};

export type ThrowbackToday = {
  /** Memory.id we're surfacing. */
  memoryId: string;
  /** The promptId of the original session — used by the re-answer path. */
  promptId: string | null;
  /** Original session date (ISO YYYY-MM-DD). */
  originalDate: string;
  /** Approximate months since original — for ageLine copy. */
  monthsAgo: number;
  /** Prompt text from the saved snapshot. */
  promptText: string;
  /** Each partner's answer from the saved snapshot. */
  responses: Array<{ userId: string; name: string | null; content: string | null }>;
};

/**
 * Hash a string deterministically (cyrb53-lite). Used to pick the throwback
 * variant on a stable share of Saturdays per couple.
 */
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h * 31) + str.charCodeAt(i)) >>> 0;
  return h;
}

function isThrowbackDay(relationshipId: string, dateStr: string): boolean {
  const buckets = 100;
  const cutoff = Math.floor(buckets * THROWBACK_SHARE);
  return hash(relationshipId + dateStr) % buckets < cutoff;
}

function isSaturday(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00.000Z");
  // Saturday in UTC. Acceptable approximation for couples in any timezone:
  // the rhythm aligns to UTC date which the rest of the app already uses.
  return d.getUTCDay() === SATURDAY;
}

function monthsBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24 * 30)));
}

/**
 * Returns a throwback Today result for the given relationship/date, or null
 * when not eligible. Caller is responsible for membership checks before
 * invoking — but we re-check defensively.
 */
export async function getThrowbackForToday(
  relationshipId: string,
  localDateStr: string
): Promise<ThrowbackToday | null> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return null;
  await requireActiveMember(session.user.id, relationshipId);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDateStr)) return null;
  if (!isSaturday(localDateStr)) return null;
  if (!isThrowbackDay(relationshipId, localDateStr)) return null;

  const today = new Date(localDateStr + "T00:00:00.000Z");
  const cutoff = new Date(today);
  cutoff.setUTCDate(cutoff.getUTCDate() - MIN_AGE_DAYS);

  // Pick deterministically among eligible memories: oldest first by savedAt
  // and break ties by (relationshipId + dateStr) hash modulo eligible count.
  const eligible = await prisma.memory.findMany({
    where: {
      relationshipId,
      sourceType: "session_reveal",
      savedAt: { lte: cutoff },
    },
    orderBy: { savedAt: "asc" },
    select: { id: true, sourceId: true, savedAt: true, snapshot: true },
  });
  if (eligible.length === 0) return null;

  const idx = hash(relationshipId + localDateStr) % eligible.length;
  const memory = eligible[idx]!;

  // Resolve original DailySession to get promptId (snapshot only stores text).
  const sourceSession = memory.sourceId
    ? await prisma.dailySession.findUnique({
        where: { id: memory.sourceId },
        select: { promptId: true, sessionDate: true },
      })
    : null;

  const snap = memory.snapshot as unknown as StoredSnapshot | null;
  const promptText = snap?.promptText ?? "";
  const responses = (snap?.responses ?? []).map((r) => ({
    userId: r.userId,
    name: r.name ?? null,
    content: r.content ?? null,
  }));

  if (!promptText || responses.length === 0) return null;

  return {
    memoryId: memory.id,
    promptId: sourceSession?.promptId ?? null,
    originalDate: (sourceSession?.sessionDate ?? memory.savedAt).toISOString().slice(0, 10),
    monthsAgo: monthsBetween(sourceSession?.sessionDate ?? memory.savedAt, today),
    promptText,
    responses,
  };
}

// Exposed for unit smoke only.
export const __testing = { hash, isThrowbackDay, isSaturday, monthsBetween };
