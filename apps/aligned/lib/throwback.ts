// apps/aligned/lib/throwback.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/relationship-members";
import { getServerAuthSession } from "@/lib/auth";
import {
  hash,
  isSaturday,
  isThrowbackDay,
  monthsBetween,
  MIN_AGE_DAYS,
} from "@/lib/throwback-internal";

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
