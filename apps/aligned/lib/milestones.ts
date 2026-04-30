"use server";

import { prisma } from "@/lib/prisma";

export type MilestoneContext =
  | "anniversary"
  | "streak-7"
  | "streak-30"
  | "streak-100"
  | "streak-365";

export type MilestonePromptResult = {
  id: string;
  text: string;
  momentText: string | null;
};

/** Fast deterministic 32-bit hash — same algo as prompt-scheduler. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Deterministically picks one milestone prompt for a given relationship +
 * context. Same couple on the same milestone type always gets the same
 * question (until a new batch is seeded). Returns null if no milestone
 * prompts exist yet.
 */
export async function getMilestonePrompt(
  relationshipId: string,
  context: MilestoneContext
): Promise<MilestonePromptResult | null> {
  const prompts = await prisma.prompt.findMany({
    where: { isMilestone: true, active: true, type: "daily" },
    select: { id: true, text: true, momentText: true },
    orderBy: { createdAt: "asc" },
  });
  if (prompts.length === 0) return null;

  const seed = hash(`${relationshipId}::milestone::${context}`);
  const idx = seed % prompts.length;
  return prompts[idx];
}
