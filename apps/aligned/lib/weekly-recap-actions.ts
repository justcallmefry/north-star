"use server";

import { getServerAuthSession } from "@/lib/auth";
import { getActiveRelationshipsForUser } from "@/lib/relationships";
import { getWeeklyRecap, recapIsReady } from "@/lib/weekly-recap";

export type RecapTeaser = { daysTogether: number; topWord: string | null };

/**
 * For the Today card. Takes no ids: the relationship is derived from the
 * signed-in user, so nothing here can be pointed at another couple.
 */
export async function getMyRecapTeaser(): Promise<RecapTeaser | null> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return null;
  const [relationship] = await getActiveRelationshipsForUser(session.user.id);
  if (!relationship) return null;
  const recap = await getWeeklyRecap(relationship.id);
  if (!recapIsReady(recap)) return null;
  return { daysTogether: recap.daysTogether, topWord: recap.sharedWords[0] ?? null };
}
