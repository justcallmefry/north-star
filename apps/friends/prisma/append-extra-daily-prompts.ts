/**
 * Inserts additional daily prompts if missing (matched by exact `text`).
 * From apps/friends: npx tsx prisma/append-extra-daily-prompts.ts
 */
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

const EXTRA_PROMPTS: Array<{
  text: string;
  momentText?: string | null;
  category: "gratitude" | "communication" | "reflection" | "fun" | "growth" | "other";
  tone?: "light" | "deep" | "playful" | "serious";
}> = [
  { text: "What's a bright spot from today or yesterday you'd want to remember?", category: "growth", tone: "light" },
  { text: "When did you feel most grounded or like yourself recently?", category: "reflection", tone: "light" },
  { text: "What's a kindness you noticed or received lately?", category: "gratitude", tone: "light" },
  { text: "What went a little better than you expected recently?", category: "gratitude", tone: "light" },
  { text: "What's something you're quietly proud of lately, even if it's small?", category: "growth", tone: "light" },
  { text: "What feeling from the last few days do you want to hold on to?", category: "reflection", tone: "light" },
  { text: "When did you feel calm or safe recently?", category: "reflection", tone: "light" },
  {
    text: "Who or what made you feel supported lately?",
    category: "gratitude",
    tone: "light",
    momentText: "If you'd like, share what that meant to you.",
  },
  {
    text: "What's something you're curious about right now — about life, yourself, or your relationship?",
    category: "growth",
    tone: "light",
  },
  { text: "What's a song, meal, place, or view that lifted your mood lately?", category: "fun", tone: "light" },
  { text: "What's something you're hoping for soon — big or small?", category: "growth", tone: "light" },
  { text: "When did you slow down long enough to notice something good?", category: "reflection", tone: "light" },
  { text: "What's a moment you'd want to describe in a letter to your future self?", category: "reflection", tone: "deep" },
  { text: "What would the you from a year ago cheer about in your life now?", category: "growth", tone: "light" },
  { text: "What's something that felt meaningful, even if nobody else saw it?", category: "reflection", tone: "deep" },
  { text: "What's a small thing you did for yourself lately that helped?", category: "growth", tone: "light" },
  {
    text: "What's one sentence about how you're really doing that you'd want your partner to hear?",
    category: "communication",
    tone: "deep",
    momentText: "Share only what feels right — there's no wrong answer.",
  },
  { text: "What's a photo you wish you'd taken this week — what would it have captured?", category: "fun", tone: "playful" },
  { text: "What's something you're looking forward to sharing with your partner?", category: "communication", tone: "light" },
];

async function main() {
  let added = 0;
  for (const p of EXTRA_PROMPTS) {
    const existing = await prisma.prompt.findFirst({
      where: { type: "daily", text: p.text },
      select: { id: true },
    });
    if (existing) continue;
    await prisma.prompt.create({
      data: {
        text: p.text,
        momentText: p.momentText ?? null,
        type: "daily",
        category: p.category,
        tone: p.tone ?? null,
        isPremium: false,
        active: true,
      },
    });
    added += 1;
  }
  console.log(added === 0 ? "No new prompts to add (already present)." : `Added ${added} daily prompt(s).`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
