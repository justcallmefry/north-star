import { prisma } from "@/lib/prisma";
import { pickBestAnswer } from "../best-answer";
import { pickBestMatch } from "../best-match";
import { chooseCover } from "../cover";
import { pickHeadline } from "../headline";
import { pickNextDare } from "../next-dare";
import { pickQuestionToSitWith } from "../question-to-sit-with";
import { pickSavedMoment } from "../saved-moment";
import { topWords } from "../themes";
import type { IssueSection } from "../types";

export async function buildWeeklyIssue(args: {
  relationshipId: string;
  start: Date;
  end: Date;
  weekKey: string;
}): Promise<{
  headline: string;
  coverPhotoUrl: string | null;
  coverGradient: { primary: string; secondary: string } | null;
  sections: IssueSection[];
} | null> {
  const { relationshipId, start, end, weekKey } = args;

  const sessions = await prisma.dailySession.findMany({
    where: { relationshipId, sessionDate: { gte: start, lt: end } },
    select: {
      sessionDate: true,
      responses: { select: { content: true } }, // Response.content (NOT answer)
    },
  });

  const daysAnswered = sessions.filter((s) => s.responses.length > 0).length;
  if (daysAnswered < 2) return null;

  const allAnswers = sessions.flatMap((s) =>
    s.responses.map((r) => r.content ?? "").filter(Boolean)
  );

  const themeWords = topWords(allAnswers, 3);
  const bestAnswer = await pickBestAnswer(prisma, relationshipId, start, end);
  const bestMatch = await pickBestMatch(prisma, relationshipId, start, end);
  const savedMoment = await pickSavedMoment(prisma, relationshipId, start, end);
  const nextDare = await pickNextDare(prisma, relationshipId, end);
  const reflection = pickQuestionToSitWith(relationshipId, weekKey);

  const streakRow = await prisma.streak.findUnique({
    where: { relationshipId },
    select: { currentCount: true },
  });

  const sections: IssueSection[] = [];
  sections.push({
    kind: "numbers",
    daysAnswered,
    totalDays: 7,
    streak: streakRow?.currentCount ?? 0,
    matches: bestMatch?.totalMatches ?? 0,
  });
  if (themeWords.length > 0) sections.push({ kind: "themes", words: themeWords });
  if (bestAnswer) sections.push({ kind: "answerOfWeek", ...bestAnswer });
  if (bestMatch) sections.push({ kind: "alignedOn", ...bestMatch });
  if (savedMoment) sections.push(savedMoment);
  if (nextDare) sections.push(nextDare);
  sections.push(reflection);

  const candidatePhoto =
    savedMoment && savedMoment.kind === "savedMoment" ? savedMoment.photoUrl : null;
  const cover = chooseCover(relationshipId, candidatePhoto);

  const headline = pickHeadline({
    relationshipId,
    weekKey,
    topWords: themeWords,
    bestMatchText: bestMatch?.chosen ?? null,
  });

  return {
    headline,
    coverPhotoUrl: cover.kind === "photo" ? cover.url : null,
    coverGradient: cover.kind === "gradient" ? cover.gradient : null,
    sections,
  };
}
