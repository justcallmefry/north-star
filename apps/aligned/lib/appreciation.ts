"use server";

import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember, getActiveMemberIds } from "@/lib/relationship-members";
import { sendPushToUser } from "@/lib/push";

/** Returns "YYYY-WNN" ISO week key for a given date. */
function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // ISO week: Thursday determines the week year
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export type AppreciationStatus =
  | { type: "sent"; content: string; toName: string | null; createdAt: Date }
  | { type: "received"; content: string; fromName: string | null; fromImage: string | null; createdAt: Date }
  | { type: "available"; partnerName: string | null }
  | { type: "none" }; // no partner yet

/** Get this week's appreciation state for the current user in a relationship. */
export async function getAppreciationStatus(
  relationshipId: string
): Promise<AppreciationStatus> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  await requireActiveMember(session.user.id, relationshipId);

  const memberIds = await getActiveMemberIds(relationshipId);
  if (memberIds.length < 2) return { type: "none" };

  const weekKey = isoWeekKey(new Date());
  const userId = session.user.id;
  const partnerIds = memberIds.filter((id) => id !== userId);

  // Check if I sent one this week
  const sent = await prisma.appreciation.findFirst({
    where: { relationshipId, fromUserId: userId, weekKey },
    include: { toUser: { select: { name: true } } },
  });
  if (sent) {
    return { type: "sent", content: sent.content, toName: sent.toUser.name, createdAt: sent.createdAt };
  }

  // Check if I received one this week
  const received = await prisma.appreciation.findFirst({
    where: { relationshipId, toUserId: userId, weekKey },
    include: { fromUser: { select: { name: true, image: true } } },
  });
  if (received) {
    return {
      type: "received",
      content: received.content,
      fromName: received.fromUser.name,
      fromImage: received.fromUser.image,
      createdAt: received.createdAt,
    };
  }

  // Available to send — get partner name
  const partner = await prisma.user.findUnique({
    where: { id: partnerIds[0] },
    select: { name: true },
  });

  return { type: "available", partnerName: partner?.name ?? null };
}

export async function sendAppreciation(
  relationshipId: string,
  content: string
): Promise<void> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  await requireActiveMember(session.user.id, relationshipId);

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Appreciation cannot be empty.");
  if (trimmed.length > 600) throw new Error("Keep it under 600 characters.");

  const memberIds = await getActiveMemberIds(relationshipId);
  if (memberIds.length < 2) throw new Error("No partner found.");

  const weekKey = isoWeekKey(new Date());
  const userId = session.user.id;
  const partnerId = memberIds.find((id) => id !== userId)!;

  await prisma.appreciation.create({
    data: { relationshipId, fromUserId: userId, toUserId: partnerId, content: trimmed, weekKey },
  });

  // Notify partner
  const sender = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  const senderName = sender?.name ?? "Your partner";
  await sendPushToUser(partnerId, {
    title: `${senderName} left you something.`,
    body: "From them, for you.",
    url: `/app/appreciation`,
  }).catch(() => {/* non-fatal */});

  revalidatePath("/app");
  revalidatePath("/app/appreciation");
}
