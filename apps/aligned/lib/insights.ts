"use server";

import { prisma } from "@/lib/prisma";
import { getAgreementDayIndex, getAgreementQuestions } from "@/lib/agreement-utils";
import { coupleTypeForAlignmentPct, type CoupleType } from "@/lib/couple-types";

const MIN_SESSIONS_FOR_INSIGHTS = 7;

/** A statement extracted from the data with its agreement metric. */
export type StatementInsight = {
  text: string;
  /** Distance between the two answers on the 5-point Likert scale (0–4). */
  distance: number;
  /** ISO date the statement was answered. */
  date: string;
};

export type CoupleInsights =
  | {
      ready: false;
      sessionsCompleted: number;
      sessionsRequired: number;
    }
  | {
      ready: true;
      sessionsCompleted: number;
      statementsScored: number;
      /** Percentage of statements where partners answered within 1 Likert step. */
      alignmentPct: number;
      /** Percentage of guesses where partner correctly predicted other's answer. */
      mindReadingPct: number;
      /** Top 3 statements where partners landed closest. */
      topAligned: StatementInsight[];
      /** Top 3 statements where partners diverged the most. */
      topDivergent: StatementInsight[];
      coupleType: CoupleType;
    };

function safeParseIndices(s: string): number[] {
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed.map((n) => Number(n)) : [];
  } catch {
    return [];
  }
}

function toIsoDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export async function getCoupleInsights(relationshipId: string): Promise<CoupleInsights> {
  const sessions = await prisma.agreementSession.findMany({
    where: {
      relationshipId,
      state: "revealed",
    },
    orderBy: { sessionDate: "desc" },
    select: {
      id: true,
      sessionDate: true,
      participations: {
        select: {
          userId: true,
          answerIndices: true,
          guessIndices: true,
        },
      },
    },
  });

  const usableSessions = sessions.filter((s) => s.participations.length === 2);
  const sessionsCompleted = usableSessions.length;

  if (sessionsCompleted < MIN_SESSIONS_FOR_INSIGHTS) {
    return {
      ready: false,
      sessionsCompleted,
      sessionsRequired: MIN_SESSIONS_FOR_INSIGHTS,
    };
  }

  let totalStatements = 0;
  let alignedCount = 0;
  let totalGuesses = 0;
  let correctGuesses = 0;
  const allScored: StatementInsight[] = [];

  for (const s of usableSessions) {
    const dayIndex = getAgreementDayIndex(s.sessionDate);
    const questions = getAgreementQuestions(dayIndex);
    const [pA, pB] = s.participations;
    const aAns = safeParseIndices(pA.answerIndices);
    const bAns = safeParseIndices(pB.answerIndices);
    const aGuess = safeParseIndices(pA.guessIndices);
    const bGuess = safeParseIndices(pB.guessIndices);
    const isoDate = toIsoDate(s.sessionDate);

    for (let i = 0; i < questions.length; i++) {
      const aA = aAns[i];
      const bA = bAns[i];
      if (typeof aA !== "number" || typeof bA !== "number" || aA < 0 || bA < 0) continue;
      const dist = Math.abs(aA - bA);
      totalStatements++;
      if (dist <= 1) alignedCount++;
      allScored.push({
        text: questions[i].text,
        distance: dist,
        date: isoDate,
      });

      const aG = aGuess[i];
      const bG = bGuess[i];
      if (typeof aG === "number" && aG >= 0) {
        totalGuesses++;
        if (aG === bA) correctGuesses++;
      }
      if (typeof bG === "number" && bG >= 0) {
        totalGuesses++;
        if (bG === aA) correctGuesses++;
      }
    }
  }

  if (totalStatements === 0) {
    return {
      ready: false,
      sessionsCompleted,
      sessionsRequired: MIN_SESSIONS_FOR_INSIGHTS,
    };
  }

  const alignmentPct = (alignedCount / totalStatements) * 100;
  const mindReadingPct = totalGuesses > 0 ? (correctGuesses / totalGuesses) * 100 : 0;

  // De-duplicate by statement text — repeats across cycles shouldn't dominate.
  const byText = new Map<string, StatementInsight>();
  for (const item of allScored) {
    const existing = byText.get(item.text);
    // Keep the most recent occurrence
    if (!existing || item.date > existing.date) byText.set(item.text, item);
  }
  const unique = Array.from(byText.values());

  const topAligned = [...unique]
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);
  const topDivergent = [...unique]
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 3);

  return {
    ready: true,
    sessionsCompleted,
    statementsScored: totalStatements,
    alignmentPct,
    mindReadingPct,
    topAligned,
    topDivergent,
    coupleType: coupleTypeForAlignmentPct(alignmentPct),
  };
}
