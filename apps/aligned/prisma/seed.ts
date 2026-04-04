import "./load-env";
import { PrismaClient } from "../generated/prisma";
import { DAILY_PROMPTS } from "./daily-prompts-data";

const prisma = new PrismaClient();

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
      tone: p.tone,
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
