"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma";
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

/** Today at midnight UTC — one agreement per UTC day, consistent across servers and timezones. */
function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function getAgreementForToday(
  relationshipId: string
): Promise<AgreementForTodayResult | null> {
  const authSession = await getServerAuthSession();
  if (!authSession?.user?.id) return null;
  await requireActiveMember(authSession.user.id, relationshipId);

  const today = todayUTC();

  const latestSession = await prisma.agreementSession.findFirst({
    where: { relationshipId },
    orderBy: { sessionDate: "desc" },
    include: {
      participations: {
        include: { user: { select: { id: true, name: true, image: true } } },
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

    let session = await prisma.agreementSession.findUnique({
      where: {
        relationshipId_sessionDate: { relationshipId, sessionDate: today },
      },
      include: {
        participations: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });

    if (!session) {
      try {
        session = await prisma.agreementSession.create({
          data: {
            relationshipId,
            sessionDate: today,
            state: "open",
          },
          include: {
            participations: {
              include: { user: { select: { id: true, name: true, image: true } } },
            },
          },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          session = await prisma.agreementSession.findUnique({
            where: {
              relationshipId_sessionDate: { relationshipId, sessionDate: today },
            },
            include: {
              participations: {
                include: { user: { select: { id: true, name: true, image: true } } },
              },
            },
          });
        }
        if (!session) throw e;
      }
    }
    agreementSession = session;
  }

  const myPart = agreementSession.participations.find(
    (p) => p.userId === authSession.user!.id
  );
  const partnerPart = agreementSession.participations.find(
    (p) => p.userId !== authSession.user!.id
  );
  const partner = agreementSession.participations.find(
    (p) => p.userId !== authSession.user!.id
  )?.user;

  const otherMember = await prisma.relationshipMember.findFirst({
    where: {
      relationshipId,
      userId: { not: authSession.user!.id },
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
    myImage: (authSession.user as { image?: string | null }).image ?? null,
    partnerImage: partner?.image ?? null,
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

    const allRevealed = await prisma.agreementSession.findMany({
      where: { relationshipId, state: "revealed" },
      include: { participations: true },
    });
    let overallMyScore = 0;
    let overallPartnerScore = 0;
    for (const s of allRevealed) {
      const myP = s.participations.find((p) => p.userId === authSession.user!.id);
      const partnerP = s.participations.find((p) => p.userId !== authSession.user!.id);
      if (myP && partnerP) {
        const myG = parseIndices(myP.guessIndices);
        const pAns = parseIndices(partnerP.answerIndices);
        const partnerG = parseIndices(partnerP.guessIndices);
        const myAns = parseIndices(myP.answerIndices);
        for (let i = 0; i < 5; i++) {
          if (myG[i] === pAns[i]) overallMyScore++;
          if (partnerG[i] === myAns[i]) overallPartnerScore++;
        }
      }
    }
    const overallTotal = 5 * allRevealed.length;

    result.reveal = {
      myScore,
      partnerScore,
      myAnswers,
      myGuesses,
      partnerAnswers,
      partnerGuesses,
      partnerName: partner?.name ?? null,
      overallMyScore,
      overallPartnerScore,
      overallTotal,
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

  const today = todayUTC();

  const latestSession = await prisma.agreementSession.findFirst({
    where: { relationshipId },
    orderBy: { sessionDate: "desc" },
    include: { participations: true },
  });

  let agreementSession: NonNullable<typeof latestSession>;
  if (latestSession && latestSession.state === "open") {
    agreementSession = latestSession;
  } else {
    let s = await prisma.agreementSession.findUnique({
      where: {
        relationshipId_sessionDate: { relationshipId, sessionDate: today },
      },
      include: { participations: true },
    });
    if (!s) {
      try {
        s = await prisma.agreementSession.create({
          data: {
            relationshipId,
            sessionDate: today,
            state: "open",
          },
          include: { participations: true },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          s = await prisma.agreementSession.findUnique({
            where: {
              relationshipId_sessionDate: { relationshipId, sessionDate: today },
            },
            include: { participations: true },
          });
        }
        if (!s) throw e;
      }
    }
    agreementSession = s;
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
