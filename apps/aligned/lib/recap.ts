"use server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/relationship-members";

export type SundayRecapResult = {
  answeredDays: number;
  totalDays: number;
  /** The question from the session where both answers shared the most words. */
  bestMatchPrompt: string | null;
  /** Up to 3 words that appeared most across all answers this week. */
  topWords: string[];
};

const STOP = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by","from","is","are",
  "was","were","be","been","have","has","had","do","does","did","will","would","could","should",
  "i","you","we","they","he","she","it","my","your","our","their","this","that","just","so",
  "not","no","if","as","me","him","us","them","very","really","get","got","go","some","any",
  "out","all","can","one","two","more","what","when","where","how","why","also","then","like",
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
}

export async function getSundayRecap(
  relationshipId: string,
  localDateStr: string
): Promise<SundayRecapResult> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  await requireActiveMember(session.user.id, relationshipId);

  const anchor = new Date(localDateStr + "T00:00:00.000Z");
  // Week starts Monday — go back to find Monday
  const dayOfWeek = anchor.getUTCDay(); // 0=Sun,1=Mon...6=Sat
  const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() - daysBack);

  const sessions = await prisma.dailySession.findMany({
    where: {
      relationshipId,
      sessionDate: { gte: monday, lte: anchor },
    },
    include: {
      prompt: { select: { text: true } },
      responses: { select: { content: true } },
    },
  });

  const totalDays = 7;
  const answeredDays = sessions.filter((s) => s.state === "revealed").length;

  // Find best match (most shared words between responses in a session)
  let bestMatchPrompt: string | null = null;
  let bestMatchScore = 0;
  const wordFreq: Record<string, number> = {};

  for (const s of sessions) {
    if (s.state !== "revealed" || s.responses.length < 2) continue;
    const texts = s.responses.map((r) => r.content ?? "").filter(Boolean);
    // Accumulate word frequency across all answers this week
    texts.flatMap(words).forEach((w) => { wordFreq[w] = (wordFreq[w] ?? 0) + 1; });
    // Shared words between all answers in this session
    const sets = texts.map((t) => new Set(words(t)));
    const shared = [...sets[0]!].filter((w) => sets.slice(1).every((s) => s.has(w)));
    if (shared.length > bestMatchScore) {
      bestMatchScore = shared.length;
      bestMatchPrompt = s.prompt?.text ?? null;
    }
  }

  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w);

  return { answeredDays, totalDays, bestMatchPrompt, topWords };
}
