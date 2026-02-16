import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

const DAILY_PROMPTS: Array<{
  text: string;
  category: "gratitude" | "communication" | "reflection" | "fun" | "growth" | "other";
  tone?: "light" | "deep" | "playful" | "serious";
}> = [
  // Gratitude
  { text: "What's one small thing that made you smile today?", category: "gratitude", tone: "light" },
  { text: "What's something you're glad you have in your life right now?", category: "gratitude", tone: "light" },
  { text: "Who or what felt like a gift to you this week?", category: "gratitude", tone: "light" },
  { text: "What's a moment from today you'd want to remember?", category: "gratitude", tone: "light" },
  { text: "What's something simple you're thankful for today?", category: "gratitude", tone: "light" },
  { text: "What felt good about today, even if it was small?", category: "gratitude", tone: "light" },
  { text: "What's one thing about your partner you were glad for recently?", category: "gratitude", tone: "light" },
  { text: "What's a part of your routine that you actually enjoy?", category: "gratitude", tone: "light" },
  { text: "What surprised you in a good way lately?", category: "gratitude", tone: "light" },
  { text: "What made you feel a little bit lighter today?", category: "gratitude", tone: "light" },
  // Communication (connection)
  { text: "What's something you appreciated about us this week?", category: "communication", tone: "light" },
  { text: "What's one thing you'd want your partner to know about your day?", category: "communication", tone: "light" },
  { text: "What's been on your mind more than you expected lately?", category: "communication", tone: "deep" },
  { text: "What's a moment when you felt really heard this week?", category: "communication", tone: "light" },
  { text: "What do you wish you had more time to talk about together?", category: "communication", tone: "deep" },
  { text: "What's something small that made you feel connected to your partner recently?", category: "communication", tone: "light" },
  { text: "What's one thing you're looking forward to doing together?", category: "communication", tone: "light" },
  { text: "What's a question you've been curious to ask your partner?", category: "communication", tone: "playful" },
  { text: "What felt easy between you two this week?", category: "communication", tone: "light" },
  { text: "What's something you'd want to do more of as a couple?", category: "communication", tone: "light" },
  // Reflection
  { text: "What's one small thing that brought you comfort today?", category: "reflection", tone: "light" },
  { text: "What's been taking up more of your energy than you expected?", category: "reflection", tone: "deep" },
  { text: "What's something you've been thinking about that you haven't said yet?", category: "reflection", tone: "deep" },
  { text: "What's one way you've been kind to yourself lately?", category: "reflection", tone: "light" },
  { text: "What's a moment this week when you felt like yourself?", category: "reflection", tone: "light" },
  { text: "What's something that's been on repeat in your head?", category: "reflection", tone: "deep" },
  { text: "What's one thing you'd do differently if you could redo this week?", category: "reflection", tone: "deep" },
  { text: "What's been feeling heavy or light lately?", category: "reflection", tone: "deep" },
  { text: "What's a small win you had this week that no one else might notice?", category: "reflection", tone: "light" },
  { text: "What's something you're still figuring out?", category: "reflection", tone: "deep" },
  // Fun
  { text: "What's something that made you laugh recently?", category: "fun", tone: "playful" },
  { text: "What's a silly or fun moment from your week?", category: "fun", tone: "playful" },
  { text: "What's something you'd love to do together just for fun?", category: "fun", tone: "playful" },
  { text: "What's a show, song, or game you've been into lately?", category: "fun", tone: "playful" },
  { text: "What's something that brought you joy, even for a moment?", category: "fun", tone: "light" },
  { text: "What's a place you'd love to go with your partner when you get the chance?", category: "fun", tone: "playful" },
  { text: "What's something you used to do for fun that you'd like to try again?", category: "fun", tone: "playful" },
  { text: "What's a memory of the two of you that still makes you smile?", category: "fun", tone: "light" },
  { text: "What's something that made you feel playful this week?", category: "fun", tone: "playful" },
  { text: "What's one thing you're looking forward to that's just for you?", category: "fun", tone: "light" },
];

async function main() {
  const existing = await prisma.prompt.count({ where: { type: "daily" } });
  if (existing > 0) {
    console.log(`Found ${existing} daily prompts. Skipping seed (run once).`);
    return;
  }
  console.log("Seeding 40 daily prompts...");
  await prisma.prompt.createMany({
    data: DAILY_PROMPTS.map((p) => ({
      text: p.text,
      type: "daily",
      category: p.category,
      tone: p.tone ?? null,
      isPremium: false,
      active: true,
    })),
  });
  console.log("Done.");
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
