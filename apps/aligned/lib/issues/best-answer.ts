import { prisma as defaultPrisma } from "@/lib/prisma";

export async function pickBestAnswer(
  prisma: typeof defaultPrisma,
  relationshipId: string,
  start: Date,
  end: Date
): Promise<{ quote: string; attributedTo: "a" | "b"; promptText: string } | null> {
  // Schema notes:
  //   Response.content  — the answer text (not .answer)
  //   Response.validations — ResponseValidation[] (not .stickers)
  //   ResponseValidation.reactions — string | null  (emoji chars; non-null = reacted)
  //   RelationshipMember.leftAt — null means still active

  const sessions = await prisma.dailySession.findMany({
    where: {
      relationshipId,
      sessionDate: { gte: start, lt: end },
    },
    select: {
      prompt: { select: { text: true } },
      responses: {
        select: {
          userId: true,
          content: true,
          validations: { select: { reactions: true } },
        },
      },
    },
  });

  const members = await prisma.relationshipMember.findMany({
    where: { relationshipId, leftAt: null },
    orderBy: { createdAt: "asc" },
    select: { userId: true },
    take: 2,
  });

  const partnerA = members[0]?.userId;
  if (!partnerA) return null;

  type Candidate = {
    quote: string;
    userId: string;
    promptText: string;
    reactions: number;
    len: number;
  };

  const all: Candidate[] = [];
  for (const s of sessions) {
    const promptText = s.prompt?.text ?? "";
    for (const r of s.responses) {
      const text = (r.content ?? "").trim();
      if (!text) continue;
      // Count validations where the partner actually left a reaction (non-null, non-empty)
      const reactionCount = r.validations.filter(
        (v) => v.reactions != null && v.reactions.length > 0
      ).length;
      all.push({
        quote: text,
        userId: r.userId,
        promptText,
        reactions: reactionCount,
        len: text.length,
      });
    }
  }

  if (all.length === 0) return null;

  const reacted = all.filter((c) => c.reactions > 0);
  const pool = reacted.length > 0 ? reacted : all;
  pool.sort((a, b) => b.reactions - a.reactions || b.len - a.len);

  const winner = pool[0]!;
  return {
    quote: winner.quote,
    attributedTo: winner.userId === partnerA ? "a" : "b",
    promptText: winner.promptText,
  };
}
