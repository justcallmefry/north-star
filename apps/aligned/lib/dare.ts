"use server";

import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/relationship-members";
import { DARES } from "@/lib/content/dares";
import type { Dare } from "@/lib/content/dares";
import { isoWeekKey } from "@/lib/week";

export type { Dare } from "@/lib/content/dares";

function pickDareIndex(relationshipId: string, weekKey: string): number {
  let hash = 0;
  const str = relationshipId + weekKey;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return hash % DARES.length;
}

export type DareForWeekResult = {
  dareId: string;
  dare: Dare;
  weekKey: string;
  accepted: boolean;
  completed: boolean;
  photoUrl: string | null;
};

export async function getDareForWeek(relationshipId: string): Promise<DareForWeekResult> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  await requireActiveMember(session.user.id, relationshipId);

  const weekKey = isoWeekKey(new Date());
  const dareIndex = pickDareIndex(relationshipId, weekKey);

  let dare = await prisma.dateNightDare.findUnique({
    where: { relationshipId_weekKey: { relationshipId, weekKey } },
  });
  if (!dare) {
    dare = await prisma.dateNightDare.create({
      data: { relationshipId, weekKey, dareIndex },
    });
  }

  return {
    dareId: dare.id,
    dare: DARES[dare.dareIndex] ?? DARES[0]!,
    weekKey,
    accepted: !!dare.acceptedAt,
    completed: !!dare.completedAt,
    photoUrl: dare.photoUrl ?? null,
  };
}

export async function acceptDare(dareId: string): Promise<void> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  const dare = await prisma.dateNightDare.findUnique({ where: { id: dareId } });
  if (!dare) throw new Error("Dare not found");
  await requireActiveMember(session.user.id, dare.relationshipId);
  if (!dare.acceptedAt) {
    await prisma.dateNightDare.update({ where: { id: dareId }, data: { acceptedAt: new Date() } });
  }
  revalidatePath("/app/dare");
  revalidatePath("/app");
}

export async function completeDare(dareId: string, photoUrl?: string): Promise<void> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  const dare = await prisma.dateNightDare.findUnique({ where: { id: dareId } });
  if (!dare) throw new Error("Dare not found");
  await requireActiveMember(session.user.id, dare.relationshipId);
  await prisma.dateNightDare.update({
    where: { id: dareId },
    data: {
      acceptedAt: dare.acceptedAt ?? new Date(),
      completedAt: new Date(),
      // Only overwrite photoUrl when one was provided this call.
      ...(photoUrl ? { photoUrl } : {}),
    },
  });
  revalidatePath("/app/dare");
  revalidatePath("/app");
}

/**
 * Public accessor for a dare's display copy by index. Used by the magazine
 * generator so it doesn't have to import the full DARES array.
 */
export async function getDareCopy(idx: number): Promise<Dare | null> {
  return DARES[idx] ?? null;
}
