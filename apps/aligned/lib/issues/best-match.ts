import { prisma as defaultPrisma } from "@/lib/prisma";

// Schema notes:
//   WyrSession has no `question` relation — questions are indexed from a static list.
//   WyrSession.questionIndex  — Int pointing into WYR_QUESTIONS array
//   WyrSession.participations — WyrParticipation[] (not .responses)
//   WyrParticipation.choice   — Int: 0 = optionA, 1 = optionB
//   WyrSession.createdAt      — used for date range filter (no dedicated sessionDate column for range)

type WyrQuestion = { optionA: string; optionB: string };

// Mirror of the static list in lib/wyr.ts — kept here so this module has no server-action import.
const WYR_QUESTIONS: WyrQuestion[] = [
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

export async function pickBestMatch(
  prisma: typeof defaultPrisma,
  relationshipId: string,
  start: Date,
  end: Date
): Promise<{ source: "wyr"; chosen: string; day: string; totalMatches: number } | null> {
  const wyrs = await prisma.wyrSession.findMany({
    where: {
      relationshipId,
      // sessionDate is a @db.Date — filter by the date column for accuracy
      sessionDate: { gte: start, lt: end },
    },
    select: {
      id: true,
      sessionDate: true,
      questionIndex: true,
      participations: { select: { choice: true } },
    },
    orderBy: { sessionDate: "desc" },
  });

  const matched = wyrs.filter(
    (w) =>
      w.participations.length === 2 &&
      w.participations[0]!.choice === w.participations[1]!.choice
  );

  if (matched.length === 0) return null;

  const winner = matched[0]!;
  const choice = winner.participations[0]!.choice as 0 | 1;
  const question = WYR_QUESTIONS[winner.questionIndex] ?? WYR_QUESTIONS[0]!;
  const text = choice === 0 ? question.optionA : question.optionB;
  const day = new Date(winner.sessionDate).toLocaleDateString("en-US", { weekday: "long" });

  return {
    source: "wyr",
    chosen: text,
    day,
    totalMatches: matched.length,
  };
}
