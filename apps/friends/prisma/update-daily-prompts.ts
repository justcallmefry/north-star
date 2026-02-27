/**
 * One-off script to update existing daily prompts to the new "anytime" wording.
 * Run with: npx tsx prisma/update-daily-prompts.ts
 */
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

const DAILY_PROMPTS = [
  { text: "What's one small thing that made you smile lately?", momentText: "If you want, tell your partner one thing you appreciate about them right now." },
  { text: "What's something you're glad you have in your life right now?", momentText: null },
  { text: "Who or what felt like a gift to you this week?", momentText: null },
  { text: "What's a moment lately you'd want to remember?", momentText: "If it feels right, share something that's been on your mind lately." },
  { text: "What's something simple you're thankful for right now?", momentText: null },
  { text: "What's felt good lately, even if it was small?", momentText: null },
  { text: "What's one thing about your partner you were glad for recently?", momentText: "If you'd like, name one small way they showed up for you this week." },
  { text: "What's a part of your routine that you actually enjoy?", momentText: null },
  { text: "What surprised you in a good way lately?", momentText: null },
  { text: "What's made you feel a little bit lighter lately?", momentText: null },
  { text: "What's something you appreciated about us this week?", momentText: null },
  { text: "What's one thing you'd want your partner to know about how you're doing?", momentText: "If it feels right, share something that's been on your mind lately." },
  { text: "What's been on your mind more than you expected lately?", momentText: null },
  { text: "What's a moment when you felt really heard this week?", momentText: null },
  { text: "What do you wish you had more time to talk about together?", momentText: null },
  { text: "What's something small that made you feel connected to your partner recently?", momentText: null },
  { text: "What's one thing you're looking forward to doing together?", momentText: null },
  { text: "What's a question you've been curious to ask your partner?", momentText: null },
  { text: "What felt easy between you two this week?", momentText: null },
  { text: "What's something you'd want to do more of as a couple?", momentText: null },
  { text: "What's one small thing that's brought you comfort lately?", momentText: null },
  { text: "What's been taking up more of your energy than you expected?", momentText: "If you want, share one thing that's felt heavy or light lately." },
  { text: "What's something you've been thinking about that you haven't said yet?", momentText: null },
  { text: "What's one way you've been kind to yourself lately?", momentText: null },
  { text: "What's a moment this week when you felt like yourself?", momentText: null },
  { text: "What's something that's been on repeat in your head?", momentText: null },
  { text: "What's one thing you'd do differently if you could redo this week?", momentText: null },
  { text: "What's been feeling heavy or light lately?", momentText: null },
  { text: "What's a small win you had this week that no one else might notice?", momentText: null },
  { text: "What's something you're still figuring out?", momentText: null },
  { text: "What's something that made you laugh recently?", momentText: null },
  { text: "What's a silly or fun moment from your week?", momentText: null },
  { text: "What's something you'd love to do together just for fun?", momentText: null },
  { text: "What's a show, song, or game you've been into lately?", momentText: null },
  { text: "What's something that brought you joy, even for a moment?", momentText: null },
  { text: "What's a place you'd love to go with your partner when you get the chance?", momentText: null },
  { text: "What's something you used to do for fun that you'd like to try again?", momentText: null },
  { text: "What's a memory of the two of you that still makes you smile?", momentText: null },
  { text: "What's something that made you feel playful this week?", momentText: null },
  { text: "What's one thing you're looking forward to that's just for you?", momentText: null },
];

async function main() {
  const prompts = await prisma.prompt.findMany({
    where: { type: "daily" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (prompts.length === 0) {
    console.log("No daily prompts found. Run db:seed first.");
    return;
  }
  const toUpdate = Math.min(prompts.length, DAILY_PROMPTS.length);
  if (prompts.length !== DAILY_PROMPTS.length) {
    console.log(`Found ${prompts.length} prompts; updating first ${toUpdate} to match new list.`);
  }
  for (let i = 0; i < toUpdate; i++) {
    const row = DAILY_PROMPTS[i];
    await prisma.prompt.update({
      where: { id: prompts[i].id },
      data: { text: row.text, momentText: row.momentText },
    });
  }
  console.log(`Updated ${toUpdate} daily prompt(s) to the new "anytime" wording.`);
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
