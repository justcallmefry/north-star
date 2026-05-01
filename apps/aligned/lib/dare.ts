"use server";

import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/relationship-members";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DareForWeekResult = {
  dareId: string;
  weekKey: string;
  title: string;
  description: string;
  /** Whether the current couple has accepted (started) the dare. */
  accepted: boolean;
  /** Whether the current couple has marked the dare as completed. */
  completed: boolean;
  /** Optional photo URL attached at completion time. */
  photoUrl: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the ISO week key for a given date, e.g. "2026-W18". */
export function getWeekKey(date: Date = new Date()): string {
  // ISO 8601 week: week containing Thursday; Monday = first day.
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7; // 1 = Mon … 7 = Sun
  d.setUTCDate(d.getUTCDate() + 4 - day); // nearest Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Server actions
// ---------------------------------------------------------------------------

/** Fetches the dare for the current ISO week for the given relationship. */
export async function getDareForWeek(
  relationshipId: string,
  weekKey?: string
): Promise<DareForWeekResult | null> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return null;
  await requireActiveMember(session.user.id, relationshipId);

  const key = weekKey ?? getWeekKey();

  const dare = await prisma.dare.findUnique({
    where: { weekKey: key },
    include: {
      completions: {
        where: { relationshipId },
      },
    },
  });

  if (!dare) return null;

  const completion = dare.completions[0] ?? null;

  return {
    dareId: dare.id,
    weekKey: dare.weekKey,
    title: dare.title,
    description: dare.description,
    // "accepted" is modeled as having a completion row (even without completedAt
    // being finalised). For the MVP we treat "accepted" == "completed" since
    // completion is a single-step action. This field is kept for future use.
    accepted: completion !== null,
    completed: completion !== null,
    photoUrl: completion?.photoUrl ?? null,
  };
}

/** Marks the dare as completed for the given relationship, optionally attaching a photo. */
export async function completeDare(
  dareId: string,
  photoUrl?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return { ok: false, error: "Not signed in" };

  // Verify the dare exists and find the caller's relationship.
  const dare = await prisma.dare.findUnique({ where: { id: dareId } });
  if (!dare) return { ok: false, error: "Dare not found" };

  // Find the couple's relationship via the current user's membership.
  const member = await prisma.relationshipMember.findFirst({
    where: { userId: session.user.id, leftAt: null },
    select: { relationshipId: true },
  });
  if (!member) return { ok: false, error: "No active relationship" };

  const { relationshipId } = member;

  await prisma.dareCompletion.upsert({
    where: { dareId_relationshipId: { dareId, relationshipId } },
    update: {
      completedAt: new Date(),
      // Only overwrite photoUrl when a new one is provided.
      ...(photoUrl !== undefined ? { photoUrl } : {}),
    },
    create: {
      dareId,
      relationshipId,
      completedAt: new Date(),
      photoUrl: photoUrl ?? null,
    },
  });

  revalidatePath("/app/dare");
  revalidatePath("/app");
  return { ok: true };
}
