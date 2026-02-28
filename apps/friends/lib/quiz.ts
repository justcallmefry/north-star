"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember, todayUTC } from "@/lib/relationship-members";
import type { QuizQuestion } from "@/lib/quiz-utils";
import { getQuizDayIndex, getQuizQuestions } from "@/lib/quiz-utils";

export type { QuizQuestion } from "@/lib/quiz-utils";

export type QuizForTodayResult = {
  quizSessionId: string;
  sessionDate: string;
  dayIndex: number;
  questions: QuizQuestion[];
  state: "open" | "revealed";
  myParticipation: { answerIndices: number[]; guessIndices: number[] } | null;
  partnerSubmitted: boolean;
  /** Partner's display name when available (from relationship or participations) */
  partnerName: string | null;
  /** Current user's profile image URL (for reveal UI) */
  myImage: string | null;
  /** Partner's profile image URL (for reveal UI) */
  partnerImage: string | null;
  /** When revealed: my score (correct guesses), partner score, both participations for UI, and overall totals */
  reveal?: {
    myScore: number;
    partnerScore: number;
    myAnswers: number[];
    myGuesses: number[];
    partnerAnswers: number[];
    partnerGuesses: number[];
    partnerName: string | null;
    /** Sum of your score across all revealed sessions */
    overallMyScore: number;
    /** Sum of partner's score across all revealed sessions */
    overallPartnerScore: number;
    /** Total possible (5 per session × number of revealed sessions) */
    overallTotal: number;
  };
};

export async function getQuizForToday(
  relationshipId: string,
  localDateStr?: string
): Promise<QuizForTodayResult | null> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return null;
  await requireActiveMember(session.user.id, relationshipId);

  const today =
    localDateStr && /^\d{4}-\d{2}-\d{2}$/.test(localDateStr)
      ? new Date(localDateStr + "T00:00:00.000Z")
      : todayUTC();

  // Same quiz until both complete. Use the latest session if it's still open.
  const latestSession = await prisma.quizSession.findFirst({
    where: { relationshipId },
    orderBy: { sessionDate: "desc" },
    include: {
      participations: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  let quizSession: NonNullable<typeof latestSession>;
  let dayIndex: number;
  let questions: QuizQuestion[];

  const todayStr = localDateStr && /^\d{4}-\d{2}-\d{2}$/.test(localDateStr) ? localDateStr : today.toISOString().slice(0, 10);
  const latestDateStr = latestSession?.sessionDate.toISOString().slice(0, 10);
  if (latestSession && latestSession.state === "open" && latestDateStr === todayStr) {
    quizSession = latestSession;
    dayIndex = getQuizDayIndex(quizSession.sessionDate);
    questions = getQuizQuestions(dayIndex);
  } else {
    // No session yet, or previous one is revealed — get or create today's quiz (one per UTC day)
    dayIndex = getQuizDayIndex(today);
    questions = getQuizQuestions(dayIndex);

    let session = await prisma.quizSession.findUnique({
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
        session = await prisma.quizSession.create({
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
          session = await prisma.quizSession.findUnique({
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
    quizSession = session;
  }

  const myPart = quizSession.participations.find(
    (p) => p.userId === session.user!.id
  );
  const partnerPart = quizSession.participations.find(
    (p) => p.userId !== session.user!.id
  );
  const partner = quizSession.participations.find(
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

  const result: QuizForTodayResult = {
    quizSessionId: quizSession.id,
    sessionDate: quizSession.sessionDate.toISOString().slice(0, 10),
    dayIndex,
    questions,
    state: quizSession.state === "revealed" ? "revealed" : "open",
    myParticipation: myPart
      ? {
          answerIndices: parseIndices(myPart.answerIndices),
          guessIndices: parseIndices(myPart.guessIndices),
        }
      : null,
    partnerSubmitted: !!partnerPart,
    partnerName,
    myImage: (session.user as { image?: string | null }).image ?? null,
    partnerImage: partner?.image ?? null,
  };

  if (quizSession.state === "revealed" && myPart && partnerPart) {
    const myAnswers = parseIndices(myPart.answerIndices);
    const myGuesses = parseIndices(myPart.guessIndices);
    const partnerAnswers = parseIndices(partnerPart.answerIndices);
    const partnerGuesses = parseIndices(partnerPart.guessIndices);
    let myScore = 0;
    let partnerScore = 0;
    for (let i = 0; i < 5; i++) {
      if (myGuesses[i] === partnerAnswers[i]) myScore++;
      if (partnerGuesses[i] === myAnswers[i]) partnerScore++;
    }

    const allRevealed = await prisma.quizSession.findMany({
      where: { relationshipId, state: "revealed" },
      include: { participations: true },
    });
    let overallMyScore = 0;
    let overallPartnerScore = 0;
    for (const s of allRevealed) {
      const myP = s.participations.find((p) => p.userId === session.user!.id);
      const partnerP = s.participations.find((p) => p.userId !== session.user!.id);
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

/** Returns quiz for a specific date only if a session exists (no create). Used for "Yesterday's results". */
export async function getQuizForDate(
  relationshipId: string,
  dateStr: string
): Promise<QuizForTodayResult | null> {
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
    const session = await getServerAuthSession();
    if (!session?.user?.id) return null;
    await requireActiveMember(session.user.id, relationshipId);

    const sessionDate = new Date(dateStr + "T00:00:00.000Z");
  const quizSession = await prisma.quizSession.findUnique({
    where: {
      relationshipId_sessionDate: { relationshipId, sessionDate },
    },
    include: {
      participations: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });
  if (!quizSession) return null;

  const dayIndex = getQuizDayIndex(quizSession.sessionDate);
  const questions = getQuizQuestions(dayIndex);
  const myPart = quizSession.participations.find((p) => p.userId === session.user!.id);
  const partnerPart = quizSession.participations.find((p) => p.userId !== session.user!.id);
  const partner = quizSession.participations.find((p) => p.userId !== session.user!.id)?.user;
  const otherMember = await prisma.relationshipMember.findFirst({
    where: { relationshipId, userId: { not: session.user!.id }, leftAt: null },
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

  const result: QuizForTodayResult = {
    quizSessionId: quizSession.id,
    sessionDate: quizSession.sessionDate.toISOString().slice(0, 10),
    dayIndex,
    questions,
    state: quizSession.state === "revealed" ? "revealed" : "open",
    myParticipation: myPart ? { answerIndices: parseIndices(myPart.answerIndices), guessIndices: parseIndices(myPart.guessIndices) } : null,
    partnerSubmitted: !!partnerPart,
    partnerName,
    myImage: (session.user as { image?: string | null }).image ?? null,
    partnerImage: partner?.image ?? null,
  };

  if (quizSession.state === "revealed" && myPart && partnerPart) {
    const myAnswers = parseIndices(myPart.answerIndices);
    const myGuesses = parseIndices(myPart.guessIndices);
    const partnerAnswers = parseIndices(partnerPart.answerIndices);
    const partnerGuesses = parseIndices(partnerPart.guessIndices);
    let myScore = 0;
    let partnerScore = 0;
    for (let i = 0; i < 5; i++) {
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
      overallMyScore: myScore,
      overallPartnerScore: partnerScore,
      overallTotal: 5,
    };
  }
  return result;
  } catch {
    return null;
  }
}

export async function submitQuiz(
  relationshipId: string,
  answerIndices: number[],
  guessIndices: number[],
  localDateStr?: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return { ok: false, error: "Not signed in" };
  if (answerIndices.length !== 5 || guessIndices.length !== 5)
    return { ok: false, error: "Need 5 answers and 5 guesses" };

  await requireActiveMember(session.user.id, relationshipId);

  const today =
    localDateStr && /^\d{4}-\d{2}-\d{2}$/.test(localDateStr)
      ? new Date(localDateStr + "T00:00:00.000Z")
      : todayUTC();

  // Same logic as getQuizForToday: submit to the open session if one exists, else today's
  const latestSession = await prisma.quizSession.findFirst({
    where: { relationshipId },
    orderBy: { sessionDate: "desc" },
    include: { participations: true },
  });

  let quizSession: NonNullable<typeof latestSession>;
  if (latestSession && latestSession.state === "open") {
    quizSession = latestSession;
  } else {
    let s = await prisma.quizSession.findUnique({
      where: {
        relationshipId_sessionDate: { relationshipId, sessionDate: today },
      },
      include: { participations: true },
    });
    if (!s) {
      try {
        s = await prisma.quizSession.create({
          data: {
            relationshipId,
            sessionDate: today,
            state: "open",
          },
          include: { participations: true },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          s = await prisma.quizSession.findUnique({
            where: {
              relationshipId_sessionDate: { relationshipId, sessionDate: today },
            },
            include: { participations: true },
          });
        }
        if (!s) throw e;
      }
    }
    quizSession = s;
  }

  const payload = JSON.stringify(answerIndices);
  const guessPayload = JSON.stringify(guessIndices);

  await prisma.quizParticipation.upsert({
    where: {
      quizSessionId_userId: {
        quizSessionId: quizSession.id,
        userId: session.user.id,
      },
    },
    create: {
      quizSessionId: quizSession.id,
      userId: session.user.id,
      answerIndices: payload,
      guessIndices: guessPayload,
    },
    update: {
      answerIndices: payload,
      guessIndices: guessPayload,
    },
  });

  const updated = await prisma.quizSession.findUnique({
    where: { id: quizSession.id },
    include: { participations: true },
  });
  if (updated && updated.participations.length === 2) {
    await prisma.quizSession.update({
      where: { id: quizSession.id },
      data: { state: "revealed" },
    });
  }

  revalidatePath("/app");
  revalidatePath("/app/quiz");
  return { ok: true };
}
