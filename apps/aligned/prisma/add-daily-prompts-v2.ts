/**
 * Idempotently adds the v2 batch of daily prompts. Safe to run multiple
 * times — checks each prompt by `text` and only inserts if missing.
 *
 * Run with:  npx tsx prisma/add-daily-prompts-v2.ts
 */
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

type SeedPrompt = {
  text: string;
  momentText?: string | null;
  category: "gratitude" | "communication" | "reflection" | "fun" | "growth";
  tone: "light" | "deep" | "playful" | "serious";
};

const NEW_PROMPTS: SeedPrompt[] = [
  // —— Gratitude (8) ——
  { text: "What's something your partner did this week that you didn't say thank you for?", category: "gratitude", tone: "light", momentText: "If it still applies, tell them now." },
  { text: "What's a small thing about your home that you appreciate today?", category: "gratitude", tone: "light" },
  { text: "What's something about your body that's been on your side lately?", category: "gratitude", tone: "deep" },
  { text: "What's a way someone showed up for you recently that surprised you?", category: "gratitude", tone: "light" },
  { text: "What's something you used to take for granted that you don't anymore?", category: "gratitude", tone: "deep" },
  { text: "What's an everyday thing your partner does that quietly makes your life better?", category: "gratitude", tone: "light" },
  { text: "What's a comfort you reach for that you don't say out loud?", category: "gratitude", tone: "light" },
  { text: "What's something good in your life right now that you didn't expect a year ago?", category: "gratitude", tone: "deep" },

  // —— Communication (12) ——
  { text: "What's something you've been holding back from saying — not because it's bad, but because there's no good moment?", category: "communication", tone: "deep" },
  { text: "What's a way you wish your partner would ask about your day?", category: "communication", tone: "light", momentText: "Try it tomorrow if you can." },
  { text: "What's something that's easier to text than say out loud — and why do you think that is?", category: "communication", tone: "playful" },
  { text: "When was the last time you felt truly listened to — not just heard?", category: "communication", tone: "deep" },
  { text: "What's a topic you'd love to talk about more, but it never quite comes up?", category: "communication", tone: "light" },
  { text: "What's a habit of yours your partner probably finds a little weird but never brings up?", category: "communication", tone: "playful" },
  { text: "What's a compliment you've been meaning to give but haven't?", category: "communication", tone: "light", momentText: "Now's a good moment." },
  { text: "What's something you'd want your partner to know about how you handle stress?", category: "communication", tone: "deep" },
  { text: "What's a way your partner makes you feel safe?", category: "communication", tone: "light" },
  { text: "What's something you wish you were better at communicating?", category: "communication", tone: "deep" },
  { text: "What's a sign — for you — that something's bothering you that your partner might miss?", category: "communication", tone: "deep" },
  { text: "What's something kind you've been thinking about your partner lately and haven't said?", category: "communication", tone: "light", momentText: "Tell them now if you'd like." },

  // —— Reflection (12) ——
  { text: "What's something you've changed your mind about in the last year?", category: "reflection", tone: "deep" },
  { text: "What's been quietly draining you that you haven't named yet?", category: "reflection", tone: "deep" },
  { text: "What's a season of your life you find yourself thinking about lately?", category: "reflection", tone: "deep" },
  { text: "What's something you used to want that you don't anymore?", category: "reflection", tone: "deep" },
  { text: "What's a piece of advice you've actually listened to recently?", category: "reflection", tone: "light" },
  { text: "What's something you've been avoiding that you know you'll be glad you did?", category: "reflection", tone: "deep" },
  { text: "What's a part of you that doesn't get much room in your day-to-day?", category: "reflection", tone: "deep" },
  { text: "What's a small thing you've been doing for yourself lately?", category: "reflection", tone: "light" },
  { text: "What's a question you've been sitting with this week?", category: "reflection", tone: "deep" },
  { text: "What's something you're proud of yourself for that nobody's noticed?", category: "reflection", tone: "deep" },
  { text: "What's something you used to believe about love that you don't anymore?", category: "reflection", tone: "deep" },
  { text: "What's a memory that's been close to the surface lately?", category: "reflection", tone: "deep" },

  // —— Fun (10) ——
  { text: "If you had a free Saturday with no obligations, what's the most \"you\" version of that day?", category: "fun", tone: "playful" },
  { text: "What's a song you'd play in the car to tell your partner exactly what mood you're in?", category: "fun", tone: "playful" },
  { text: "What's a place you've been with your partner that you'd happily go back to right now?", category: "fun", tone: "light" },
  { text: "What's a totally impractical thing you'd love to do together someday?", category: "fun", tone: "playful" },
  { text: "If money and time didn't matter, what would you want to eat with your partner tonight?", category: "fun", tone: "playful" },
  { text: "What's a tiny daily thing your partner does that secretly delights you?", category: "fun", tone: "playful" },
  { text: "What's something you used to find funny that you still find funny?", category: "fun", tone: "playful" },
  { text: "What's a hobby or interest you'd love to share with your partner — even if they've never tried it?", category: "fun", tone: "light" },
  { text: "What's a movie or book you'd want to experience for the first time again with your partner?", category: "fun", tone: "playful" },
  { text: "What's the most fun thing you've done together this year?", category: "fun", tone: "light" },

  // —— Growth (18) ——
  { text: "What's something you're working on in yourself that your partner might not know about?", category: "growth", tone: "deep" },
  { text: "What's a fear of yours that's gotten quieter over the years?", category: "growth", tone: "deep" },
  { text: "What's something you've gotten better at without really trying?", category: "growth", tone: "light" },
  { text: "What's a habit you'd love to build, if you had a partner in it?", category: "growth", tone: "light" },
  { text: "What's a part of yourself you've been giving more room to lately?", category: "growth", tone: "deep" },
  { text: "What's something you've forgiven yourself for?", category: "growth", tone: "deep" },
  { text: "What's a way you'd like to grow as a partner this year?", category: "growth", tone: "deep" },
  { text: "What's something you're learning that's harder than you expected?", category: "growth", tone: "light" },
  { text: "What's a way you've changed since you got together that you're glad about?", category: "growth", tone: "light" },
  { text: "What's something you used to be afraid to say that you can say now?", category: "growth", tone: "deep" },
  { text: "What's a hard truth you've been kinder to yourself about lately?", category: "growth", tone: "deep" },
  { text: "What's something you'd want to be braver about?", category: "growth", tone: "deep" },
  { text: "What's an area where you'd like to be a softer person?", category: "growth", tone: "deep" },
  { text: "What's something you've stopped apologizing for?", category: "growth", tone: "deep" },
  { text: "What's a kind of strength you see in your partner that you'd like to grow in yourself?", category: "growth", tone: "deep" },
  { text: "What's something small you'd like to start doing this week?", category: "growth", tone: "light" },
  { text: "What's an old habit that no longer fits who you're becoming?", category: "growth", tone: "deep" },
  { text: "What's a way you'd like your partner to challenge you, gently?", category: "growth", tone: "deep" },
];

async function main() {
  let added = 0;
  let skipped = 0;
  for (const p of NEW_PROMPTS) {
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
        momentText: p.momentText ?? null,
        type: "daily",
        category: p.category,
        tone: p.tone,
        isPremium: false,
        active: true,
      },
    });
    added++;
  }
  console.log(`Added ${added} new prompts. Skipped ${skipped} existing.`);
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
