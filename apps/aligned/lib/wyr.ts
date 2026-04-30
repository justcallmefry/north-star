"use server";

import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember, getActiveMemberIds } from "@/lib/relationship-members";

export type WyrQuestion = { optionA: string; optionB: string };

export const WYR_QUESTIONS: WyrQuestion[] = [
  { optionA: "Spontaneous road trip with no plan", optionB: "Perfectly planned vacation" },
  { optionA: "A cozy night in every weekend", optionB: "Always something new to do" },
  { optionA: "Live in the city", optionB: "Live somewhere quiet and slow" },
  { optionA: "Know what's coming", optionB: "Be surprised" },
  { optionA: "Cook dinner together every night", optionB: "Try a new restaurant every week" },
  { optionA: "Fewer, deeper friendships", optionB: "A big social circle" },
  { optionA: "Early mornings together", optionB: "Late nights together" },
  { optionA: "Travel somewhere familiar you love", optionB: "Travel somewhere totally new" },
  { optionA: "A small home that feels perfect", optionB: "A big home with room to grow" },
  { optionA: "Work from home together", optionB: "Have separate work spaces" },
  { optionA: "A dog", optionB: "A cat" },
  { optionA: "Save aggressively and retire early", optionB: "Spend freely and work longer" },
  { optionA: "Live close to family", optionB: "Build your own world somewhere new" },
  { optionA: "Slow Sunday mornings", optionB: "Active weekend adventures" },
  { optionA: "Know exactly what you want", optionB: "Be open to anything" },
  { optionA: "A career that excites you", optionB: "A job that funds your real life" },
  { optionA: "Beach vacation", optionB: "Mountain getaway" },
  { optionA: "Watch something together every night", optionB: "Read in the same room" },
  { optionA: "Buy the thing you love", optionB: "Save and wait" },
  { optionA: "Take the leap and figure it out", optionB: "Plan carefully before moving" },
  { optionA: "Always have music on", optionB: "Comfortable silence" },
  { optionA: "Celebrate every little win", optionB: "Save the big celebrations for big things" },
  { optionA: "Move abroad for a year", optionB: "Stay and build deeper roots" },
  { optionA: "Have a tight daily routine", optionB: "Go with the flow each day" },
  { optionA: "Know your partner's every thought", optionB: "Keep a little mystery" },
];

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
  partnerSubmitted: boolean;
  partnerName: string | null;
  reveal?: {
    myChoice: 0 | 1;
    partnerChoice: 0 | 1;
    matched: boolean;
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

  return {
    wyrSessionId: wyrSession.id,
    question,
    state: isRevealed ? "revealed" : "open",
    myChoice: myParticipation ? (myParticipation.choice as 0 | 1) : null,
    partnerSubmitted: !!partnerParticipation,
    partnerName: partner?.name ?? null,
    ...(isRevealed && myParticipation && partnerParticipation
      ? {
          reveal: {
            myChoice: myParticipation.choice as 0 | 1,
            partnerChoice: partnerParticipation.choice as 0 | 1,
            matched: myParticipation.choice === partnerParticipation.choice,
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
