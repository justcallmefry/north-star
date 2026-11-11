"use server";

import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { getActiveRelationshipsForUser } from "@/lib/relationships";

export type OnThisDay = { sessionId: string; label: string; promptText: string | null };

/**
 * A day from the couple's past to resurface on Today: a year ago, else six
 * months ago, else a month ago, matching the calendar date. Takes the
 * caller's local date (so it rolls at their midnight), no ids.
 */
export async function getOnThisDay(localDate: string): Promise<OnThisDay | null> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return null;
  const [rel] = await getActiveRelationshipsForUser(session.user.id);
  if (!rel) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) return null;
  const [y, m, d] = localDate.split("-").map(Number) as [number, number, number];

  const candidates: { label: string; date: Date }[] = [
    { label: "A year ago today", date: new Date(Date.UTC(y - 1, m - 1, d)) },
    { label: "Six months ago today", date: new Date(Date.UTC(y, m - 7, d)) },
    { label: "A month ago today", date: new Date(Date.UTC(y, m - 2, d)) },
  ];
  for (const c of candidates) {
    // Skip dates that rolled over (e.g. March 31 → "February 31").
    if (c.date.getUTCDate() !== d) continue;
    const s = await prisma.dailySession.findFirst({
      where: { relationshipId: rel.id, sessionDate: c.date, state: "revealed" },
      select: { id: true, prompt: { select: { text: true } } },
    });
    if (s) return { sessionId: s.id, label: c.label, promptText: s.prompt?.text ?? null };
  }
  return null;
}
