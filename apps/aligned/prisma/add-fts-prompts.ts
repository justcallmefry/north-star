/**
 * Seeds "Finish the Sentence" prompts.
 * Prompts contain "___" — the UI splits on it and shows the prefix + completion.
 * Run: npx tsx prisma/add-fts-prompts.ts
 */
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

const FTS_PROMPTS = [
  { text: "The thing I love most about waking up next to you is ___.", category: "gratitude", tone: "deep" },
  { text: "When I picture us in 10 years, I see ___.", category: "reflection", tone: "deep" },
  { text: "The moment I knew I really liked you was ___.", category: "reflection", tone: "light" },
  { text: "I feel most like myself when we ___.", category: "growth", tone: "deep" },
  { text: "One thing I wish we did more of together is ___.", category: "communication", tone: "light" },
  { text: "The best part of our day is usually ___.", category: "gratitude", tone: "light" },
  { text: "When you're stressed, the thing that seems to help most is ___.", category: "communication", tone: "deep" },
  { text: "I laugh the hardest when we ___.", category: "fun", tone: "playful" },
  { text: "Something about you that still surprises me sometimes is ___.", category: "reflection", tone: "light" },
  { text: "If I could give you one day off from everything, we'd spend it ___.", category: "fun", tone: "playful" },
  { text: "I feel closest to you when ___.", category: "reflection", tone: "deep" },
  { text: "The most underrated thing about our relationship is ___.", category: "gratitude", tone: "deep" },
  { text: "One habit of mine I hope you never get tired of is ___.", category: "fun", tone: "playful" },
  { text: "If our relationship had a theme song right now, it would be ___ because ___.", category: "fun", tone: "playful" },
  { text: "Something I want us to still be doing together in 20 years is ___.", category: "growth", tone: "deep" },
];

async function main() {
  let added = 0;
  let skipped = 0;

  for (const p of FTS_PROMPTS) {
    const exists = await prisma.prompt.findFirst({
      where: { text: p.text },
    });
    if (exists) { skipped++; continue; }
    await prisma.prompt.create({
      data: {
        text: p.text,
        type: "daily",
        category: p.category as any,
        tone: p.tone as any,
        depthLevel: p.tone === "deep" ? 3 : 2,
        funScore: p.tone === "playful" ? 4 : 3,
        emotionalIntensity: p.tone === "deep" ? 3 : 2,
        sourceVersion: 3,
        active: true,
        subcategory: "finish-the-sentence",
        tags: ["finish-the-sentence"],
        repeatCooldownDays: 60,
      },
    });
    added++;
  }

  console.log(`FTS prompts: added ${added}, skipped ${skipped} (already existed)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
