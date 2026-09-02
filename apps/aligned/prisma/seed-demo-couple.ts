/**
 * Creates the paired demo couple that App Store review needs.
 *
 * Aligned cannot be evaluated from a single account: `canReveal` is false
 * whenever a relationship has fewer than two active members, so a reviewer
 * who signs up alone reaches the waiting room and never sees the product.
 * That is a Guideline 2.1 rejection ("incomplete functionality") and the
 * likeliest reason a first submission bounces.
 *
 * This seeds two accounts that are already paired and already have history:
 * a streak, revealed answers across several weeks, saved memories and an
 * appreciation — enough for the constellation to have a real shape and for
 * a magazine issue to generate.
 *
 * Usage:
 *   npm run db:seed-demo -w aligned
 *
 * Idempotent: re-running resets the pair's history rather than duplicating
 * it. Safe to run against production; it touches only these two accounts.
 */

import { PrismaClient } from "../generated/prisma";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "AlignedReview2026!";
const A = { email: "review-a@alignedconnectingcouples.com", name: "Casey" };
const B = { email: "review-b@alignedconnectingcouples.com", name: "Jordan" };

/** How many days of history to build. 40+ gives the sky a visible spiral. */
const DAYS = 45;

/** Answer pairs, written to read like two real people — several deliberately
 *  share a word so the reveal shows the "aligned" highlight and the
 *  constellation gets brighter stars. */
const EXCHANGES: Array<[string, string]> = [
  ["You drove to the pharmacy at midnight and never mentioned it again.", "You drove all the way back for my charger without making me feel stupid."],
  ["The way you hum when you're concentrating.", "That you notice things like the humming."],
  ["Tired. But the good kind, the kind that comes after a full day.", "Tired too. We should protect Sundays better."],
  ["Our kitchen at 7am, both of us quiet, coffee going.", "Mornings. Specifically the quiet ones before anyone needs anything."],
  ["I felt heard when you put your phone face down.", "When you asked twice, because you knew the first answer wasn't the real one."],
  ["A little scared about the move, honestly.", "The move. I keep not saying it either."],
  ["That you still ask me questions after all this time.", "That you still have new answers."],
  ["The lake, three summers ago, the day it rained the whole time.", "The lake. The rain made it better somehow."],
  ["I've been thinking about whether we take enough risks together.", "Risks. I've been thinking we're overdue for one."],
  ["You made the ordinary parts feel chosen, not settled for.", "You never treat the ordinary days as filler."],
  ["I want to learn to cook the thing your mum makes.", "Teaching you that recipe. I've been waiting to be asked."],
  ["Proud of you for the hard conversation you had this week.", "That you noticed it was hard."],
  ["More walks. That's it. That's the whole answer.", "Walks, and fewer screens on weeknights."],
  ["The version of us that's still curious in twenty years.", "Us, older, still asking. Still curious."],
  ["You let me be quiet without deciding something was wrong.", "You give me quiet without making it mean anything."],
];

function dayKey(daysAgo: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

async function upsertUser(spec: { email: string; name: string }) {
  return prisma.user.upsert({
    where: { email: spec.email },
    create: {
      email: spec.email,
      name: spec.name,
      password: hashPassword(DEMO_PASSWORD),
      emailVerified: new Date(),
    },
    update: { name: spec.name, password: hashPassword(DEMO_PASSWORD), deletedAt: null },
    select: { id: true, email: true },
  });
}

async function main() {
  const [userA, userB] = await Promise.all([upsertUser(A), upsertUser(B)]);

  // Reuse the existing demo relationship if this has been run before.
  const existing = await prisma.relationshipMember.findFirst({
    where: { userId: userA.id, leftAt: null },
    select: { relationshipId: true },
  });

  let relationshipId: string;
  if (existing) {
    relationshipId = existing.relationshipId;
    // Clear prior history so re-runs don't stack duplicate days.
    await prisma.dailySession.deleteMany({ where: { relationshipId } });
    await prisma.memory.deleteMany({ where: { relationshipId } });
    await prisma.appreciation.deleteMany({ where: { relationshipId } });
    console.log(`Reusing relationship ${relationshipId} and resetting its history`);
  } else {
    const created = await prisma.relationship.create({
      data: {
        name: "Casey & Jordan",
        status: "active",
        anniversaryDate: dayKey(400),
        members: {
          create: [
            { userId: userA.id, role: "owner" },
            { userId: userB.id, role: "member" },
          ],
        },
      },
      select: { id: true },
    });
    relationshipId = created.id;
    console.log(`Created relationship ${relationshipId}`);
  }

  const prompts = await prisma.prompt.findMany({
    where: { active: true },
    select: { id: true },
    take: DAYS,
  });
  if (prompts.length === 0) throw new Error("No active prompts — run the prompt seeds first.");

  // Build DAYS of revealed history, oldest first, so the constellation
  // spiral grows in chronological order exactly as the app derives it.
  let revealed = 0;
  const memorable: Array<{ sessionId: string; date: Date; text: [string, string] }> = [];

  for (let i = DAYS; i >= 1; i--) {
    const sessionDate = dayKey(i);
    const prompt = prompts[(DAYS - i) % prompts.length]!;
    const exchange = EXCHANGES[(DAYS - i) % EXCHANGES.length]!;

    const session = await prisma.dailySession.create({
      data: {
        relationshipId,
        sessionDate,
        promptId: prompt.id,
        state: "revealed",
        responses: {
          create: [
            { userId: userA.id, content: exchange[0] },
            { userId: userB.id, content: exchange[1] },
          ],
        },
      },
      select: { id: true },
    });
    revealed++;

    // Keep a handful as saved memories — these twinkle in the sky.
    if (i % 9 === 0) memorable.push({ sessionId: session.id, date: sessionDate, text: exchange });
  }

  for (const m of memorable) {
    await prisma.memory.create({
      data: {
        relationshipId,
        savedByUserId: userA.id,
        sourceType: "session_reveal",
        sourceId: m.sessionId,
        snapshot: {
          date: m.date.toISOString().slice(0, 10),
          answers: [
            { name: A.name, content: m.text[0] },
            { name: B.name, content: m.text[1] },
          ],
        },
      },
    });
  }

  // One appreciation this week, which is also a golden-week condition.
  await prisma.appreciation.create({
    data: {
      relationshipId,
      fromUserId: userB.id,
      toUserId: userA.id,
      content: "Thank you for the coffee you make before I'm even awake.",
      weekKey: isoWeekKey(new Date()),
    },
  });

  // Streak consistent with the history above.
  await prisma.streak.upsert({
    where: { relationshipId },
    create: {
      relationshipId,
      currentCount: DAYS,
      longestCount: DAYS,
      lastCompletedDate: dayKey(1),
      graceDays: 2,
    },
    update: {
      currentCount: DAYS,
      longestCount: DAYS,
      lastCompletedDate: dayKey(1),
      graceDays: 2,
    },
  });

  console.log("\nDemo couple ready for App Store review\n");
  console.log(`  Account A : ${userA.email}`);
  console.log(`  Account B : ${userB.email}`);
  console.log(`  Password  : ${DEMO_PASSWORD}`);
  console.log(`  History   : ${revealed} revealed days, ${memorable.length} saved memories, 1 appreciation`);
  console.log(`  Streak    : ${DAYS} days\n`);
  console.log("Today is deliberately left unanswered so a reviewer can walk");
  console.log("the full answer -> answer -> reveal sequence themselves.\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
