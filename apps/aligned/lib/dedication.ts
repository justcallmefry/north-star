"use server";

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
