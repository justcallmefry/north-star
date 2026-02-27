/**
 * Usage stats from existing DB data (no new tables).
 * Use for "how much are people using the app" — DAU, feature usage, signups.
 */

import { prisma } from "@/lib/prisma";
import { todayUTC } from "@/lib/relationship-members";

/** Start and end of a UTC day (start inclusive, end exclusive). */
function dayBounds(date: Date): { start: Date; end: Date } {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  return {
    start: new Date(Date.UTC(y, m, d)),
    end: new Date(Date.UTC(y, m, d + 1)),
  };
}

export type UsageStats = {
  /** UTC date (YYYY-MM-DD) */
  date: string;
  /** New user signups on this day (User.createdAt) */
  signups: number;
  /** Daily question: number of responses submitted for sessions with this sessionDate */
  dailyResponses: number;
  /** Daily question: number of sessions revealed (both answered) on this date */
  dailyReveals: number;
  /** Quiz: number of participations for quiz sessions with this sessionDate */
  quizParticipations: number;
  /** Agreement: number of participations for agreement sessions with this sessionDate */
  agreementParticipations: number;
  /** Distinct users who did at least one of: daily response, quiz participation, agreement participation on this date */
  activeUsers: number;
};

/**
 * Compute usage stats for a given UTC date. Defaults to today.
 * All counts use the session/prompt "day" (sessionDate) or User.createdAt in UTC.
 */
export async function getUsageStats(forDate?: Date): Promise<UsageStats> {
  const date = forDate ?? todayUTC();
  const { start, end } = dayBounds(date);
  const dateStr = date.toISOString().slice(0, 10);

  const [
    signups,
    dailyResponses,
    dailyReveals,
    quizParticipations,
    agreementParticipations,
    dailyUserIds,
    quizUserIds,
    agreementUserIds,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.response.count({
      where: {
        session: { sessionDate: { gte: start, lt: end } },
      },
    }),
    prisma.dailySession.count({
      where: {
        sessionDate: { gte: start, lt: end },
        state: "revealed",
      },
    }),
    prisma.quizParticipation.count({
      where: {
        quizSession: { sessionDate: { gte: start, lt: end } },
      },
    }),
    prisma.agreementParticipation.count({
      where: {
        agreementSession: { sessionDate: { gte: start, lt: end } },
      },
    }),
    prisma.response.findMany({
      where: { session: { sessionDate: { gte: start, lt: end } } },
      select: { userId: true },
    }),
    prisma.quizParticipation.findMany({
      where: { quizSession: { sessionDate: { gte: start, lt: end } } },
      select: { userId: true },
    }),
    prisma.agreementParticipation.findMany({
      where: { agreementSession: { sessionDate: { gte: start, lt: end } } },
      select: { userId: true },
    }),
  ]);

  const activeSet = new Set<string>();
  for (const r of dailyUserIds) activeSet.add(r.userId);
  for (const r of quizUserIds) activeSet.add(r.userId);
  for (const r of agreementUserIds) activeSet.add(r.userId);

  return {
    date: dateStr,
    signups,
    dailyResponses,
    dailyReveals,
    quizParticipations,
    agreementParticipations,
    activeUsers: activeSet.size,
  };
}
