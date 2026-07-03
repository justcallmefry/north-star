"use server";

import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { requireActiveMember, getActiveMemberIds } from "@/lib/relationship-members";

export type KeepsakeEntry = {
  sessionId: string;
  /** YYYY-MM-DD */
  date: string;
  promptText: string;
  answers: Array<{ name: string | null; content: string }>;
  /** Saved to the memory timeline. */
  kept: boolean;
};

export type KeepsakeData = {
  relationshipId: string;
  names: string[];
  firstDate: string | null;
  lastDate: string | null;
  totals: { days: number; kept: number };
  entries: KeepsakeEntry[];
};

/**
 * Every revealed day, oldest first — the raw material of the printable
 * "Our Story" book. Only sessions where both partners actually wrote
 * something make the book.
 */
export async function getKeepsake(relationshipId: string): Promise<KeepsakeData> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  await requireActiveMember(session.user.id, relationshipId);

  const memberIds = await getActiveMemberIds(relationshipId);

  const [sessions, memories, users] = await Promise.all([
    prisma.dailySession.findMany({
      where: { relationshipId, state: "revealed" },
      orderBy: { sessionDate: "asc" },
      select: {
        id: true,
        sessionDate: true,
        prompt: { select: { text: true } },
        responses: { select: { userId: true, content: true } },
      },
    }),
    prisma.memory.findMany({
      where: { relationshipId, sourceType: "session_reveal" },
      select: { sourceId: true },
    }),
    prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, name: true },
    }),
  ]);

  const savedIds = new Set(
    memories.map((m) => m.sourceId).filter((id): id is string => !!id)
  );
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  const entries: KeepsakeEntry[] = sessions
    .map((s) => {
      const answers = s.responses
        .filter((r) => r.content && r.content.trim().length > 0)
        .map((r) => ({ name: nameById.get(r.userId) ?? null, content: r.content!.trim() }));
      return {
        sessionId: s.id,
        date: s.sessionDate.toISOString().slice(0, 10),
        promptText: s.prompt?.text ?? "",
        answers,
        kept: savedIds.has(s.id),
      };
    })
    .filter((e) => e.answers.length >= 2 && e.promptText);

  return {
    relationshipId,
    names: users.map((u) => u.name).filter((n): n is string => !!n),
    firstDate: entries[0]?.date ?? null,
    lastDate: entries[entries.length - 1]?.date ?? null,
    totals: { days: entries.length, kept: entries.filter((e) => e.kept).length },
    entries,
  };
}
