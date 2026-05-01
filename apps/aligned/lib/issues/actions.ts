"use server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/relationship-members";

/**
 * Toggle the saved state of an Issue. Auth required + caller must be an
 * active member of the relationship that owns the issue.
 */
export async function toggleIssueSaved(issueId: string, saved: boolean): Promise<void> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, relationshipId: true },
  });
  if (!issue) throw new Error("Issue not found");

  await requireActiveMember(session.user.id, issue.relationshipId);

  await prisma.issue.update({
    where: { id: issueId },
    data: { savedAt: saved ? new Date() : null },
  });
}
