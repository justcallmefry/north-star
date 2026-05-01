/**
 * Anniversary-themed daily prompt seed.
 *
 * Seeds 8 prompts tagged with "anniversary". These are normal daily prompts
 * (isMilestone: false) that participate in the regular rotation but are
 * preferentially selected by the scheduler whenever today falls within the
 * 7-day window before (or on) the couple's anniversary.
 *
 * Idempotent — safe to run multiple times. Skips prompts that already exist
 * by exact text match.
 *
 * Run with:  npx tsx prisma/add-anniversary-prompts.ts
 */

import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

const ANNIVERSARY_PROMPTS = [
  {
    text: "What's a small moment from this year you don't ever want to forget?",
    category: "gratitude" as const,
    tone: "light" as const,
    depthLevel: 3,
    funScore: 2,
    emotionalIntensity: 3,
  },
  {
    text: "If we wrote a chapter title for this past year together, what would it be?",
    category: "reflection" as const,
    tone: "light" as const,
    depthLevel: 2,
    funScore: 3,
    emotionalIntensity: 3,
  },
  {
    text: "What's something you've come to love about us that surprised you?",
    category: "gratitude" as const,
    tone: "deep" as const,
    depthLevel: 3,
    funScore: 2,
    emotionalIntensity: 3,
  },
  {
    text: "What does 'home' mean now that it includes both of us?",
    category: "reflection" as const,
    tone: "deep" as const,
    depthLevel: 4,
    funScore: 1,
    emotionalIntensity: 4,
  },
  {
    text: "What do we do better together than apart?",
    category: "gratitude" as const,
    tone: "light" as const,
    depthLevel: 3,
    funScore: 2,
    emotionalIntensity: 3,
  },
  {
    text: "Name a memory from this year that still makes you laugh.",
    category: "fun" as const,
    tone: "playful" as const,
    depthLevel: 1,
    funScore: 5,
    emotionalIntensity: 1,
  },
  {
    text: "What's one quiet thing you appreciate about our day-to-day?",
    category: "gratitude" as const,
    tone: "light" as const,
    depthLevel: 2,
    funScore: 3,
    emotionalIntensity: 2,
  },
  {
    text: "If we could relive one day from this year together, which one?",
    category: "gratitude" as const,
    tone: "light" as const,
    depthLevel: 2,
    funScore: 3,
    emotionalIntensity: 3,
  },
];

async function main() {
  let added = 0;
  let skipped = 0;

  for (const p of ANNIVERSARY_PROMPTS) {
    const existing = await prisma.prompt.findFirst({
      where: { text: p.text, type: "daily" },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.prompt.create({
      data: {
        text: p.text,
        type: "daily",
        category: p.category,
        tone: p.tone,
        subcategory: "milestone",
        depthLevel: p.depthLevel,
        funScore: p.funScore,
        emotionalIntensity: p.emotionalIntensity,
        isMilestone: false, // in normal rotation; preferenced by anniversary window logic
        active: true,
        isPremium: false,
        tags: ["anniversary"],
        sourceVersion: 4,
      },
    });
    added++;
  }

  console.log(
    `Anniversary prompts seed complete:\n` +
      `  added:   ${added}\n` +
      `  skipped: ${skipped} (already existed)`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
