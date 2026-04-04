/**
 * Inserts any `daily-prompts-data` daily whose `text` is not yet in the DB.
 * From apps/aligned: npx tsx prisma/append-extra-daily-prompts.ts
 */
import "./load-env";
import { PrismaClient } from "../generated/prisma";
import { DAILY_PROMPTS } from "./daily-prompts-data";

const prisma = new PrismaClient();

async function main() {
  let added = 0;
  for (const p of DAILY_PROMPTS) {
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
        tone: p.tone,
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
