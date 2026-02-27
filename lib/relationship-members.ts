/**
 * Shared server helpers for relationship membership and date handling.
 * Used by sessions, quiz, agreement, relationships, and meetings.
 */

import { prisma } from "@/lib/prisma";

/** Throws if user is not an active member (leftAt is null). Returns the membership. */
export async function requireActiveMember(userId: string, relationshipId: string) {
  const member = await prisma.relationshipMember.findFirst({
    where: { relationshipId, userId, leftAt: null },
  });
  if (!member) throw new Error("Not a member of this relationship");
  return member;
}

/** Returns active member IDs for a relationship (leftAt is null). */
export async function getActiveMemberIds(relationshipId: string): Promise<string[]> {
  const members = await prisma.relationshipMember.findMany({
    where: { relationshipId, leftAt: null },
    select: { userId: true },
  });
  return members.map((m) => m.userId);
}

/** Today at midnight UTC (date only). Use for consistent "one per day" session/quiz/agreement. */
export function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
