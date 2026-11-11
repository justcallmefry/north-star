"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { getActiveRelationshipsForUser } from "@/lib/relationships";

export type NameResult = { ok: true; name: string } | { ok: false; error: string };

/**
 * Name a finished month's constellation. Either partner can name it or
 * rename it. Takes no relationship id; the couple is the caller's own.
 */
export async function nameConstellation(monthKey: string, rawName: string): Promise<NameResult> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return { ok: false, error: "Sign in first." };
  const [rel] = await getActiveRelationshipsForUser(session.user.id);
  if (!rel) return { ok: false, error: "Pair up first." };

  if (!/^\d{4}-\d{2}$/.test(monthKey)) return { ok: false, error: "That isn't a month." };
  const current = new Date().toISOString().slice(0, 7);
  if (monthKey >= current) return { ok: false, error: "You can name it once the month is over." };

  const name = rawName.trim().replace(/\s+/g, " ");
  if (!name) return { ok: false, error: "Give it a name." };
  if (name.length > 40) return { ok: false, error: "Keep it under 40 characters." };

  await prisma.constellationName.upsert({
    where: { relationshipId_monthKey: { relationshipId: rel.id, monthKey } },
    create: { relationshipId: rel.id, monthKey, name, namedById: session.user.id },
    update: { name, namedById: session.user.id },
  });
  revalidatePath("/app/constellation");
  return { ok: true, name };
}
