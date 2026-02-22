"use server";

import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { QuizQuestion } from "@/lib/quiz-utils";
import { getQuizDayIndex, getQuizQuestions } from "@/lib/quiz-utils";

export type { QuizQuestion } from "@/lib/quiz-utils";

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
    /** Total possible (5 per session × number of revealed sessions) */
    overallTotal: number;
  };
};

export async function getQuizForToday(
  relationshipId: string
): Promise<QuizForTodayResult | null> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return null;
  await requireActiveMember(session.user.id, relationshipId);

  const today = toDateOnly(new Date());

  // Option A: Same quiz until both complete. Use the latest session if it's still open.
  const latestSession = await prisma.quizSession.findFirst({
    where: { relationshipId },
    orderBy: { sessionDate: "desc" },
    include: {
      participations: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  let quizSession: NonNullable<typeof latestSession>;
  let dayIndex: number;
  let questions: QuizQuestion[];

  if (latestSession && latestSession.state === "open") {
    // Still waiting for one or both — keep showing this quiz
    quizSession = latestSession;
    dayIndex = getQuizDayIndex(quizSession.sessionDate);
    questions = getQuizQuestions(dayIndex);
  } else {
    // No session yet, or previous one is revealed — get or create today's quiz
    dayIndex = getQuizDayIndex(today);
    questions = getQuizQuestions(dayIndex);

    let session = await prisma.quizSession.findUnique({
      where: {
        relationshipId_sessionDate: { relationshipId, sessionDate: today },
      },
      include: {
        participations: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (!session) {
      session = await prisma.quizSession.create({
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
    for (const s of allRevealed) {
      const myP = s.participations.find((p) => p.userId === session.user!.id);
      const partnerP = s.participations.find((p) => p.userId !== session.user!.id);
      if (myP && partnerP) {
        const myG = parseIndices(myP.guessIndices);
        const pAns = parseIndices(partnerP.answerIndices);
        for (let i = 0; i < 5; i++) if (myG[i] === pAns[i]) overallMyScore++;
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
      overallTotal,
    };
  }

  return result;
}

export async function submitQuiz(
  relationshipId: string,
  answerIndices: number[],
  guessIndices: number[]
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return { ok: false, error: "Not signed in" };
  if (answerIndices.length !== 5 || guessIndices.length !== 5)
    return { ok: false, error: "Need 5 answers and 5 guesses" };

  await requireActiveMember(session.user.id, relationshipId);

  const today = toDateOnly(new Date());

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
      s = await prisma.quizSession.create({
        data: {
          relationshipId,
          sessionDate: today,
          state: "open",
        },
        include: { participations: true },
      });
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
