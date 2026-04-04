/**
 * Updates existing daily prompts in `createdAt` order to match `daily-prompts-data.ts`.
 * Run with: npx tsx prisma/update-daily-prompts.ts
 */
import "./load-env";
import { PrismaClient } from "../generated/prisma";
import { DAILY_PROMPTS } from "./daily-prompts-data";

const prisma = new PrismaClient();

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
      data: {
        text: row.text,
        momentText: row.momentText ?? null,
        category: row.category,
        tone: row.tone,
      },
    });
  }
  console.log(`Updated ${toUpdate} daily prompt(s) from daily-prompts-data.`);
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
