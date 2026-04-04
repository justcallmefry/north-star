/**
 * Prisma CLI loads `.env` next to schema; `tsx` scripts do not. Load monorepo root
 * and app-level env so `DATABASE_URL` resolves when running from `apps/aligned`.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

const prismaDir = __dirname;
const alignedRoot = resolve(prismaDir, "..");
const repoRoot = resolve(prismaDir, "..", "..", "..");

for (const p of [
  resolve(repoRoot, ".env"),
  resolve(alignedRoot, ".env"),
  resolve(alignedRoot, ".env.local"),
]) {
  if (existsSync(p)) config({ path: p, override: true });
}
