// Server-only module. Deliberately NOT "use server": these functions take a
// relationship id on trust. Call them only after authenticating the caller
// as an active member (see app/app/recap/page.tsx and lib/weekly-recap-actions.ts).

import { prisma } from "@/lib/prisma";
import { tokenize } from "@/lib/issues/stopwords";
import { detectAligned } from "@/lib/reveal/aligned";
import { todayUTC } from "@/lib/relationship-members";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * "Your week together": the shareable Sunday recap.
 *
 * Privacy line, agreed with the product owner: numbers and shared single
 * words only. No answer text, no question text, ever. Everything here may
 * end up on someone's Instagram story.
 */
export type WeeklyRecap = {
  /** First names, for "Casey & Jordan". */
  names: string[];
  /** Seven days, oldest first; true when both answered and revealed. */
  days: { label: string; together: boolean }[];
  daysTogether: number;
  /** Days whose answers shared 2+ meaningful words. */
  alignedDays: number;
  /** Words both partners used this week, most frequent first (max 4). */
  sharedWords: string[];
  streak: number;
  /** Every day they've ever revealed together: the stars in their sky. */
  totalStars: number;
  /** e.g. "Oct 5 – 11". */
  rangeLabel: string;
};

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Words too bland to headline a story ("our word this week: without").
 * The shared stopword list is tuned for the magazine; this is stricter.
 */
const FILLER = new Set([
  "without", "still", "really", "always", "never", "maybe", "thing", "things",
  "something", "anything", "everything", "nothing", "because", "would", "could",
  "should", "every", "being", "doing", "going", "getting", "little", "other",
  "their", "there", "these", "those", "where", "which", "while", "after",
  "before", "through", "again", "though", "pretty", "around", "today", "think",
  "feel", "felt", "know", "make", "made", "want", "like", "good", "time",
]);

function rangeLabel(start: Date, end: Date): string {
  const month = (d: Date) => d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  return sameMonth
    ? `${month(start)} ${start.getUTCDate()} – ${end.getUTCDate()}`
    : `${month(start)} ${start.getUTCDate()} – ${month(end)} ${end.getUTCDate()}`;
}

/** The last seven days, today included. */
export async function getWeeklyRecap(relationshipId: string): Promise<WeeklyRecap> {
  const end = todayUTC();
  const start = new Date(end.getTime() - 6 * DAY_MS);

  const [members, sessions, streak, totalStars] = await Promise.all([
    prisma.relationshipMember.findMany({
      where: { relationshipId, leftAt: null },
      select: { userId: true, user: { select: { name: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.dailySession.findMany({
      where: { relationshipId, sessionDate: { gte: start, lte: end }, state: "revealed" },
      select: { sessionDate: true, responses: { select: { userId: true, content: true } } },
    }),
    prisma.streak.findUnique({ where: { relationshipId }, select: { currentCount: true } }),
    prisma.dailySession.count({ where: { relationshipId, state: "revealed" } }),
  ]);

  const togetherDates = new Set(sessions.map((s) => s.sessionDate.toISOString().slice(0, 10)));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start.getTime() + i * DAY_MS);
    return { label: WEEKDAY[d.getUTCDay()]!, together: togetherDates.has(d.toISOString().slice(0, 10)) };
  });

  // Count, per word, how many days both partners used it.
  const wordDays = new Map<string, number>();
  let alignedDays = 0;
  for (const s of sessions) {
    const texts = s.responses.map((r) => r.content ?? "").filter(Boolean);
    if (texts.length < 2) continue;
    if (detectAligned(texts[0]!, texts[1]!) !== "none") alignedDays++;
    const sets = texts.map((t) => new Set(tokenize(t)));
    for (const w of sets[0]!) {
      if (FILLER.has(w)) continue;
      if (sets.slice(1).every((set) => set.has(w))) wordDays.set(w, (wordDays.get(w) ?? 0) + 1);
    }
  }
  const sharedWords = [...wordDays.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, 4)
    .map(([w]) => w);

  const names = members
    .map((m) => m.user.name?.trim().split(/\s+/)[0] ?? "")
    .filter(Boolean)
    .slice(0, 2);

  return {
    names,
    days,
    daysTogether: days.filter((d) => d.together).length,
    alignedDays,
    sharedWords,
    streak: streak?.currentCount ?? 0,
    totalStars,
    rangeLabel: rangeLabel(start, end),
  };
}

/** Worth a recap: at least two days together this week. */
export function recapIsReady(recap: Pick<WeeklyRecap, "daysTogether">): boolean {
  return recap.daysTogether >= 2;
}
