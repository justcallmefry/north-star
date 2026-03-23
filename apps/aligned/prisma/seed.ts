import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

const DAILY_PROMPTS: Array<{
  text: string;
  momentText?: string | null;
  category: "gratitude" | "communication" | "reflection" | "fun" | "growth" | "other";
  tone?: "light" | "deep" | "playful" | "serious";
}> = [
  // Gratitude & presence — “any time of day,” not end-of-week debrief
  { text: "What's one small thing that made you smile lately?", category: "gratitude", tone: "light", momentText: "If you want, tell your partner one thing you appreciate about them right now." },
  { text: "What's a moment from roughly the last 24 hours you'd want to remember?", category: "gratitude", tone: "light", momentText: "If it feels right, share something that's been on your mind lately." },
  { text: "Who or what felt like a gift to you lately?", category: "gratitude", tone: "light" },
  { text: "What's something tiny you noticed today that you might otherwise forget?", category: "gratitude", tone: "light" },
  { text: "What's something simple you're thankful for right now?", category: "gratitude", tone: "light" },
  { text: "What's felt good lately, even if it was small?", category: "gratitude", tone: "light" },
  { text: "What's one thing about your partner you're glad for recently?", category: "gratitude", tone: "light", momentText: "If you'd like, name one small way they showed up for you lately." },
  { text: "What's a part of your routine that you actually enjoy?", category: "gratitude", tone: "light" },
  { text: "What surprised you in a good way lately?", category: "gratitude", tone: "light" },
  { text: "What's made you feel a little lighter lately?", category: "gratitude", tone: "light" },
  // Communication (connection)
  { text: "What's something you appreciated about us lately?", category: "communication", tone: "light" },
  { text: "What's one thing you'd want your partner to know about how you're doing?", category: "communication", tone: "light", momentText: "If it feels right, share something that's been on your mind lately." },
  { text: "What's been on your mind more than you expected lately?", category: "communication", tone: "deep" },
  { text: "What's a moment recently when you felt really heard?", category: "communication", tone: "light" },
  { text: "What do you wish you had more time to talk about together?", category: "communication", tone: "deep" },
  { text: "What's something small that made you feel connected to your partner recently?", category: "communication", tone: "light" },
  { text: "What's one thing you're looking forward to doing together?", category: "communication", tone: "light" },
  { text: "What's a question you've been curious to ask your partner?", category: "communication", tone: "playful" },
  { text: "What felt easy between you two lately?", category: "communication", tone: "light" },
  { text: "What's something you'd want to do more of as a couple?", category: "communication", tone: "light" },
  // Reflection
  { text: "What's one small thing that's brought you comfort lately?", category: "reflection", tone: "light" },
  { text: "What's been taking up more of your energy than you expected?", category: "reflection", tone: "deep", momentText: "If you want, share one thing that's felt heavy or light lately." },
  { text: "What's something you've been thinking about that you haven't said yet?", category: "reflection", tone: "deep" },
  { text: "What's one way you've been kind to yourself lately?", category: "reflection", tone: "light" },
  { text: "What's a moment lately when you felt like yourself?", category: "reflection", tone: "light" },
  { text: "What's something that's been on repeat in your head?", category: "reflection", tone: "deep" },
  { text: "If you could redo one moment from the last few days, what would you change?", category: "reflection", tone: "deep" },
  { text: "What's been feeling heavy or light lately?", category: "reflection", tone: "deep" },
  { text: "What's a small win lately that no one else might notice?", category: "reflection", tone: "light" },
  { text: "What's something you're still figuring out?", category: "reflection", tone: "deep" },
  // Fun
  { text: "What's something that made you laugh recently?", category: "fun", tone: "playful" },
  { text: "What's a silly or fun moment lately?", category: "fun", tone: "playful" },
  { text: "What's something you'd love to do together just for fun?", category: "fun", tone: "playful" },
  { text: "What's a show, song, or game you've been into lately?", category: "fun", tone: "playful" },
  { text: "What's something that gave you a spark of joy, even briefly?", category: "fun", tone: "light" },
  { text: "What's a place you'd love to go with your partner when you get the chance?", category: "fun", tone: "playful" },
  { text: "What's something you used to do for fun that you'd like to try again?", category: "fun", tone: "playful" },
  { text: "What's a memory of the two of you that still makes you smile?", category: "fun", tone: "light" },
  { text: "What's something that made you feel playful lately?", category: "fun", tone: "playful" },
  { text: "What's one thing you're looking forward to that's just for you?", category: "fun", tone: "light" },
  // Growth & positive journaling — feelings, days, small wins worth revisiting
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
  const existing = await prisma.prompt.count({ where: { type: "daily" } });
  if (existing > 0) {
    console.log(`Found ${existing} daily prompts. Skipping seed (run once).`);
    return;
  }
  console.log(`Seeding ${DAILY_PROMPTS.length} daily prompts...`);
  await prisma.prompt.createMany({
    data: DAILY_PROMPTS.map((p) => ({
      text: p.text,
      momentText: p.momentText ?? null,
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
