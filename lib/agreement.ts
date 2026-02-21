"use server";

import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AgreementForTodayResult, AgreementQuestion } from "@/lib/agreement-shared";
import { getAgreementDayIndex, getAgreementQuestions } from "@/lib/agreement-utils";

async function requireActiveMember(userId: string, relationshipId: string) {
  const member = await prisma.relationshipMember.findFirst({
    where: { relationshipId, userId, leftAt: null },
  });
  if (!member) throw new Error("Not a member of this relationship");
  return member;
}

function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export async function getAgreementForToday(
  relationshipId: string
): Promise<AgreementForTodayResult | null> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return null;
  await requireActiveMember(session.user.id, relationshipId);

  const today = toDateOnly(new Date());

  const latestSession = await prisma.agreementSession.findFirst({
    where: { relationshipId },
    orderBy: { sessionDate: "desc" },
    include: {
      participations: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  let agreementSession: NonNullable<typeof latestSession>;
  let dayIndex: number;
  let questions: AgreementQuestion[];

  if (latestSession && latestSession.state === "open") {
    agreementSession = latestSession;
    dayIndex = getAgreementDayIndex(agreementSession.sessionDate);
    questions = getAgreementQuestions(dayIndex);
  } else {
    dayIndex = getAgreementDayIndex(today);
    questions = getAgreementQuestions(dayIndex);

    agreementSession = await prisma.agreementSession.findUnique({
      where: {
        relationshipId_sessionDate: { relationshipId, sessionDate: today },
      },
      include: {
        participations: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (!agreementSession) {
      agreementSession = await prisma.agreementSession.create({
        data: {
          relationshipId,
          sessionDate: today,
          state: "open",
        },
        include: {
          participations: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      });
    }
  }

  const myPart = agreementSession.participations.find(
    (p) => p.userId === session.user!.id
  );
  const partnerPart = agreementSession.participations.find(
    (p) => p.userId !== session.user!.id
  );
  const partner = agreementSession.participations.find(
    (p) => p.userId !== session.user!.id
  )?.user;

  const otherMember = await prisma.relationshipMember.findFirst({
    where: {
      relationshipId,
      userId: { not: session.user!.id },
      leftAt: null,
    },
    include: { user: { select: { name: true } } },
  });
  const partnerName = partner?.name ?? otherMember?.user?.name ?? null;

  const parseIndices = (s: string): number[] => {
    try {
      const arr = JSON.parse(s) as number[];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const result: AgreementForTodayResult = {
    agreementSessionId: agreementSession.id,
    sessionDate: agreementSession.sessionDate.toISOString().slice(0, 10),
    dayIndex,
    questions,
    state: agreementSession.state === "revealed" ? "revealed" : "open",
    myParticipation: myPart
      ? {
          answerIndices: parseIndices(myPart.answerIndices),
          guessIndices: parseIndices(myPart.guessIndices),
        }
      : null,
    partnerSubmitted: !!partnerPart,
    partnerName,
  };

  if (
    agreementSession.state === "revealed" &&
    myPart &&
    partnerPart
  ) {
    const myAnswers = parseIndices(myPart.answerIndices);
    const myGuesses = parseIndices(myPart.guessIndices);
    const partnerAnswers = parseIndices(partnerPart.answerIndices);
    const partnerGuesses = parseIndices(partnerPart.guessIndices);
    let myScore = 0;
    let partnerScore = 0;
    for (let i = 0; i < questions.length; i++) {
      if (myGuesses[i] === partnerAnswers[i]) myScore++;
      if (partnerGuesses[i] === myAnswers[i]) partnerScore++;
    }
    result.reveal = {
      myScore,
      partnerScore,
      myAnswers,
      myGuesses,
      partnerAnswers,
      partnerGuesses,
      partnerName: partner?.name ?? null,
    };
  }

  return result;
}

export async function submitAgreement(
  relationshipId: string,
  answerIndices: number[],
  guessIndices: number[]
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return { ok: false, error: "Not signed in" };
  const expectedLen = 5;
  if (
    answerIndices.length !== expectedLen ||
    guessIndices.length !== expectedLen
  )
    return {
      ok: false,
      error: `Need ${expectedLen} answers and ${expectedLen} guesses`,
    };

  await requireActiveMember(session.user.id, relationshipId);

  const today = toDateOnly(new Date());

  const latestSession = await prisma.agreementSession.findFirst({
    where: { relationshipId },
    orderBy: { sessionDate: "desc" },
    include: { participations: true },
  });

  let agreementSession: NonNullable<typeof latestSession>;
  if (latestSession && latestSession.state === "open") {
    agreementSession = latestSession;
  } else {
    agreementSession = await prisma.agreementSession.findUnique({
      where: {
        relationshipId_sessionDate: { relationshipId, sessionDate: today },
      },
      include: { participations: true },
    });
    if (!agreementSession) {
      agreementSession = await prisma.agreementSession.create({
        data: {
          relationshipId,
          sessionDate: today,
          state: "open",
        },
        include: { participations: true },
      });
    }
  }

  const payload = JSON.stringify(answerIndices);
  const guessPayload = JSON.stringify(guessIndices);

  await prisma.agreementParticipation.upsert({
    where: {
      agreementSessionId_userId: {
        agreementSessionId: agreementSession.id,
        userId: session.user.id,
      },
    },
    create: {
      agreementSessionId: agreementSession.id,
      userId: session.user.id,
      answerIndices: payload,
      guessIndices: guessPayload,
    },
    update: {
      answerIndices: payload,
      guessIndices: guessPayload,
    },
  });

  const updated = await prisma.agreementSession.findUnique({
    where: { id: agreementSession.id },
    include: { participations: true },
  });
  if (updated && updated.participations.length === 2) {
    await prisma.agreementSession.update({
      where: { id: agreementSession.id },
      data: { state: "revealed" },
    });
  }

  revalidatePath("/app");
  revalidatePath("/app/agreement");
  return { ok: true };
}
