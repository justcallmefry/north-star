"use server";

import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember, getActiveMemberIds } from "@/lib/relationship-members";
import { WYR_QUESTIONS } from "@/lib/content/wyr-questions";
import type { WyrQuestion } from "@/lib/content/wyr-questions";

export type { WyrQuestion } from "@/lib/content/wyr-questions";

/** Deterministic question index for a given relationship + date. */
function pickQuestionIndex(relationshipId: string, dateStr: string): number {
  let hash = 0;
  const str = relationshipId + dateStr;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % WYR_QUESTIONS.length;
}

export type WyrForTodayResult = {
  wyrSessionId: string;
  question: WyrQuestion;
  state: "open" | "revealed";
  myChoice: 0 | 1 | null;
  /** My "call it" — the choice I predicted my partner made. */
  myGuess: 0 | 1 | null;
  partnerSubmitted: boolean;
  partnerName: string | null;
  reveal?: {
    myChoice: 0 | 1;
    partnerChoice: 0 | 1;
    matched: boolean;
    /** Whether my call on their pick was right; undefined when I didn't guess. */
    calledIt?: boolean;
    partnerName: string | null;
  };
};

export async function getWyrForToday(
  relationshipId: string,
  localDateStr?: string
): Promise<WyrForTodayResult | null> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return null;
  await requireActiveMember(session.user.id, relationshipId);

  const memberIds = await getActiveMemberIds(relationshipId);
  if (memberIds.length < 2) return null;

  const dateStr =
    localDateStr && /^\d{4}-\d{2}-\d{2}$/.test(localDateStr)
      ? localDateStr
      : new Date().toISOString().slice(0, 10);
  const sessionDate = new Date(dateStr + "T00:00:00.000Z");
  const questionIndex = pickQuestionIndex(relationshipId, dateStr);

  let wyrSession = await prisma.wyrSession.findUnique({
    where: { relationshipId_sessionDate: { relationshipId, sessionDate } },
    include: { participations: true },
  });

  if (!wyrSession) {
    wyrSession = await prisma.wyrSession.create({
      data: { relationshipId, sessionDate, questionIndex, state: "open" },
      include: { participations: true },
    });
  }

  const userId = session.user.id;
  const partnerIds = memberIds.filter((id) => id !== userId);
  const myParticipation = wyrSession.participations.find((p) => p.userId === userId);
  const partnerParticipation = wyrSession.participations.find((p) => p.userId === partnerIds[0]);

  const partner = await prisma.user.findUnique({
    where: { id: partnerIds[0] },
    select: { name: true },
  });

  const question = WYR_QUESTIONS[wyrSession.questionIndex] ?? WYR_QUESTIONS[0]!;
  const isRevealed = wyrSession.state === "revealed";

  const myGuess =
    myParticipation?.guess === 0 || myParticipation?.guess === 1
      ? (myParticipation.guess as 0 | 1)
      : null;

  return {
    wyrSessionId: wyrSession.id,
    question,
    state: isRevealed ? "revealed" : "open",
    myChoice: myParticipation ? (myParticipation.choice as 0 | 1) : null,
    myGuess,
    partnerSubmitted: !!partnerParticipation,
    partnerName: partner?.name ?? null,
    ...(isRevealed && myParticipation && partnerParticipation
      ? {
          reveal: {
            myChoice: myParticipation.choice as 0 | 1,
            partnerChoice: partnerParticipation.choice as 0 | 1,
            matched: myParticipation.choice === partnerParticipation.choice,
            ...(myGuess != null
              ? { calledIt: myGuess === partnerParticipation.choice }
              : {}),
            partnerName: partner?.name ?? null,
          },
        }
      : {}),
  };
}

export async function submitWyrChoice(wyrSessionId: string, choice: 0 | 1): Promise<void> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  const wyrSession = await prisma.wyrSession.findUnique({
    where: { id: wyrSessionId },
    include: { participations: true },
  });
  if (!wyrSession) throw new Error("Session not found");
  await requireActiveMember(session.user.id, wyrSession.relationshipId);

  const memberIds = await getActiveMemberIds(wyrSession.relationshipId);
  const userId = session.user.id;

  await prisma.wyrParticipation.upsert({
    where: { wyrSessionId_userId: { wyrSessionId, userId } },
    create: { wyrSessionId, userId, choice },
    update: { choice },
  });

  // Auto-reveal when all members have submitted
  const updated = await prisma.wyrSession.findUnique({
    where: { id: wyrSessionId },
    include: { participations: true },
  });
  const allSubmitted =
    updated && memberIds.every((id) => updated.participations.some((p) => p.userId === id));
  if (allSubmitted && wyrSession.state === "open") {
    await prisma.wyrSession.update({ where: { id: wyrSessionId }, data: { state: "revealed" } });
  }

  revalidatePath("/app");
  revalidatePath("/app/wyr");
}

/**
 * "Call it" — record the user's prediction of their partner's choice.
 * Only possible after picking your own answer and before the reveal, so
 * in practice it's the first answerer's game while they wait.
 */
export async function submitWyrGuess(wyrSessionId: string, guess: 0 | 1): Promise<void> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  const wyrSession = await prisma.wyrSession.findUnique({
    where: { id: wyrSessionId },
    select: { id: true, relationshipId: true, state: true },
  });
  if (!wyrSession) throw new Error("Session not found");
  await requireActiveMember(session.user.id, wyrSession.relationshipId);
  if (wyrSession.state !== "open") throw new Error("Already revealed — no calling it after the fact.");

  const userId = session.user.id;
  const participation = await prisma.wyrParticipation.findUnique({
    where: { wyrSessionId_userId: { wyrSessionId, userId } },
    select: { id: true },
  });
  if (!participation) throw new Error("Pick your own answer first.");

  await prisma.wyrParticipation.update({
    where: { wyrSessionId_userId: { wyrSessionId, userId } },
    data: { guess },
  });

  revalidatePath("/app/wyr");
}
