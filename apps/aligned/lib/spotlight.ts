"use server";

import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember, getActiveMemberIds } from "@/lib/relationship-members";
import { sendPushToUser } from "@/lib/push";

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type SpotlightStatus =
  | { type: "sent"; items: string[]; toName: string | null; createdAt: Date }
  | { type: "received"; items: string[]; fromName: string | null; fromImage: string | null; createdAt: Date }
  | { type: "available"; partnerName: string | null }
  | { type: "none" };

export async function getSpotlightStatus(relationshipId: string): Promise<SpotlightStatus> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  await requireActiveMember(session.user.id, relationshipId);

  const memberIds = await getActiveMemberIds(relationshipId);
  if (memberIds.length < 2) return { type: "none" };

  const key = monthKey(new Date());
  const userId = session.user.id;
  const partnerIds = memberIds.filter((id) => id !== userId);

  const sent = await prisma.partnerSpotlight.findFirst({
    where: { relationshipId, fromUserId: userId, monthKey: key },
    include: { toUser: { select: { name: true } } },
  });
  if (sent) {
    return {
      type: "sent",
      items: sent.items as string[],
      toName: sent.toUser.name,
      createdAt: sent.createdAt,
    };
  }

  const received = await prisma.partnerSpotlight.findFirst({
    where: { relationshipId, toUserId: userId, monthKey: key },
    include: { fromUser: { select: { name: true, image: true } } },
  });
  if (received) {
    return {
      type: "received",
      items: received.items as string[],
      fromName: received.fromUser.name,
      fromImage: received.fromUser.image,
      createdAt: received.createdAt,
    };
  }

  const partner = await prisma.user.findUnique({
    where: { id: partnerIds[0] },
    select: { name: true },
  });
  return { type: "available", partnerName: partner?.name ?? null };
}

export async function sendSpotlight(relationshipId: string, items: string[]): Promise<void> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  await requireActiveMember(session.user.id, relationshipId);

  const filtered = items.map((s) => s.trim()).filter(Boolean);
  if (filtered.length < 1) throw new Error("Add at least one thing.");
  if (filtered.length > 3) throw new Error("Maximum 3 things.");
  if (filtered.some((s) => s.length > 300)) throw new Error("Each item must be under 300 characters.");

  const memberIds = await getActiveMemberIds(relationshipId);
  if (memberIds.length < 2) throw new Error("No partner found.");

  const userId = session.user.id;
  const partnerId = memberIds.find((id) => id !== userId)!;
  const key = monthKey(new Date());

  await prisma.partnerSpotlight.create({
    data: { relationshipId, fromUserId: userId, toUserId: partnerId, items: filtered, monthKey: key },
  });

  const sender = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  await sendPushToUser(partnerId, {
    title: `${sender?.name ?? "Your partner"} wrote something for you`,
    body: "3 things they love about you — this month.",
    url: "/app/spotlight",
  }).catch(() => {});

  revalidatePath("/app");
  revalidatePath("/app/spotlight");
}
