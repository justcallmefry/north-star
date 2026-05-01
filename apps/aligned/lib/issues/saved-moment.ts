import type { IssueSection } from "./types";
import { prisma as defaultPrisma } from "@/lib/prisma";

/**
 * Picks the §V "Saved Moment" section for the issue window.
 *
 * Priority:
 * 1. Most-recent dare photo in the window (completedAt in [start,end), photoUrl set)
 * 2. Most-recent appreciation in the window (text-only fallback, separate Appreciation model)
 *    Note: The Memory model stores photos only inside a `snapshot` JSON blob with no
 *    top-level photo field, so memory-photo lookup is not possible without unsafe JSON
 *    extraction. Memory photo support can be added once a top-level `photoUrl` field
 *    is added to the Memory schema.
 * 3. null — no saved-moment section this week
 */
export async function pickSavedMoment(
  prisma: typeof defaultPrisma,
  relationshipId: string,
  start: Date,
  end: Date
): Promise<Extract<IssueSection, { kind: "savedMoment" | "savedMomentFallback" }> | null> {
  // 1. Dare photo
  const dare = await prisma.dateNightDare.findFirst({
    where: {
      relationshipId,
      completedAt: { gte: start, lt: end },
      photoUrl: { not: null },
    },
    orderBy: { completedAt: "desc" },
  });
  if (dare?.photoUrl) {
    return {
      kind: "savedMoment",
      photoUrl: dare.photoUrl,
      caption: "From this week's dare.",
      source: "dare",
    };
  }

  // 2. Appreciation pull-quote (separate Appreciation model — one per person per week)
  const appreciation = await prisma.appreciation.findFirst({
    where: {
      relationshipId,
      createdAt: { gte: start, lt: end },
    },
    orderBy: { createdAt: "desc" },
  });
  if (appreciation?.content) {
    return {
      kind: "savedMomentFallback",
      quote: appreciation.content,
      attribution: "From an appreciation this week.",
    };
  }

  return null;
}
