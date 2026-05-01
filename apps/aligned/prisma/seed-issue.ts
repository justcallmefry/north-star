/**
 * Manual one-off: seeds a fake Weekly Issue for the first active relationship
 * in your local DB so you can preview /app/issues/[id] without running cron.
 *
 * Run with:  npx tsx prisma/seed-issue.ts
 *
 * Idempotent — uses a fixed issueNumber=999 so re-running just upserts.
 */
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const rel = await prisma.relationship.findFirst({
    where: { status: "active" },
    select: { id: true },
  });
  if (!rel) throw new Error("No active relationship found in this DB.");

  const start = new Date();
  start.setDate(start.getDate() - 7);
  const end = new Date();

  const sections = [
    { kind: "numbers", daysAnswered: 4, totalDays: 7, streak: 12, matches: 3 },
    { kind: "themes", words: ["sunday", "slowness", "together"] },
    {
      kind: "answerOfWeek",
      quote: "That you make me coffee on Sundays without me asking. I notice every time.",
      attributedTo: "b",
      promptText: "What's something small your partner does that means a lot?",
    },
    { kind: "alignedOn", source: "wyr", chosen: "Stay in", day: "Tuesday", totalMatches: 3 },
    {
      kind: "savedMomentFallback",
      quote: "We finally tried that ramen place on Mission. Worth it.",
      attribution: "From Saturday's dare.",
    },
    {
      kind: "nextDare",
      title: "Cook something neither of you has made before",
      description: "No recipes allowed. Improvise from whatever's in the kitchen.",
      duration: "~45 min",
    },
    {
      kind: "questionToSitWith",
      text: "What's something I've done this week that you almost said thank you for, but didn't?",
    },
  ];

  const issue = await prisma.issue.upsert({
    where: {
      relationshipId_cadence_issueNumber: {
        relationshipId: rel.id,
        cadence: "weekly",
        issueNumber: 999,
      },
    },
    update: {
      headline: "Sunday mornings, mostly.",
      sections,
      windowStart: start,
      windowEnd: end,
      publishedAt: new Date(),
    },
    create: {
      relationshipId: rel.id,
      cadence: "weekly",
      issueNumber: 999,
      volumeNumber: 1,
      windowStart: start,
      windowEnd: end,
      publishedAt: new Date(),
      headline: "Sunday mornings, mostly.",
      coverGradient: { primary: "#1f4e73", secondary: "#d4a574" },
      sections,
    },
  });

  console.log(`Seeded issue ${issue.id} for relationship ${rel.id}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
