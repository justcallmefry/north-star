"use server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/relationship-members";
import type { CoverGradient } from "./types";

export type LatestIssuePromo = {
  id: string;
  headline: string;
  issueNumber: number;
  coverPhotoUrl: string | null;
  coverGradient: CoverGradient | null;
};

/**
 * Returns the relationship's latest issue if it was published within the last
 * 7 days. Returns null otherwise (the promo card hides itself when null).
 */
export async function getLatestIssuePromo(relationshipId: string): Promise<LatestIssuePromo | null> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return null;
  await requireActiveMember(session.user.id, relationshipId);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const issue = await prisma.issue.findFirst({
    where: { relationshipId, publishedAt: { gte: sevenDaysAgo } },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      headline: true,
      issueNumber: true,
      coverPhotoUrl: true,
      coverGradient: true,
    },
  });

  if (!issue) return null;

  return {
    id: issue.id,
    headline: issue.headline,
    issueNumber: issue.issueNumber,
    coverPhotoUrl: issue.coverPhotoUrl,
    coverGradient: issue.coverGradient as CoverGradient | null,
  };
}
