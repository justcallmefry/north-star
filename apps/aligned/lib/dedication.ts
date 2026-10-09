// Server-only module. Deliberately NOT "use server": that directive turns
// every export into a publicly callable endpoint, and these functions take
// a user or relationship id on trust. Call them only from server code that
// has already authenticated the caller.

import { prisma } from "@/lib/prisma";

export type DedicationInfo = {
  /** Total number of daily check-ins this user has submitted in this relationship. */
  totalCheckIns: number;
};

/**
 * Returns dedication stats for a user in a relationship: total daily check-ins
 * (never resets). Used to show "You've done N daily check-ins" alongside the
 * couple streak.
 */
export async function getDedication(
  relationshipId: string,
  userId: string
): Promise<DedicationInfo> {
  const totalCheckIns = await prisma.response.count({
    where: {
      userId,
      session: {
        relationshipId,
      },
    },
  });

  return { totalCheckIns };
}
