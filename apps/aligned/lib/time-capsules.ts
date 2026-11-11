"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { getActiveRelationshipsForUser } from "@/lib/relationships";
import { getPartnerUserId, sendPushToUser } from "@/lib/push";
import { todayUTC } from "@/lib/relationship-members";

/**
 * Time capsules: a message sealed until a date the couple picks. Sealed
 * means sealed for both of you, the writer included; `message` is never
 * sent to the browser before its date.
 *
 * Takes no relationship ids: the couple is derived from the signed-in user.
 */

export type CapsuleView = {
  id: string;
  openOn: string; // YYYY-MM-DD
  createdAt: string;
  authorName: string | null;
  byMe: boolean;
  /** Present only once opened. */
  message: string | null;
  open: boolean;
};

const MAX_LEN = 2000;
const MAX_SEALED = 20;

async function myCouple() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return null;
  const [rel] = await getActiveRelationshipsForUser(session.user.id);
  if (!rel) return null;
  return { userId: session.user.id, relationshipId: rel.id };
}

export async function listCapsules(): Promise<CapsuleView[]> {
  const me = await myCouple();
  if (!me) return [];
  const today = todayUTC();
  const rows = await prisma.timeCapsule.findMany({
    where: { relationshipId: me.relationshipId },
    orderBy: { openOn: "asc" },
    select: {
      id: true,
      openOn: true,
      createdAt: true,
      authorId: true,
      message: true,
      author: { select: { name: true } },
    },
  });
  return rows.map((r) => {
    const open = r.openOn.getTime() <= today.getTime();
    return {
      id: r.id,
      openOn: r.openOn.toISOString().slice(0, 10),
      createdAt: r.createdAt.toISOString(),
      authorName: r.author.name?.split(/\s+/)[0] ?? null,
      byMe: r.authorId === me.userId,
      message: open ? r.message : null,
      open,
    };
  });
}

export type SealResult = { ok: true } | { ok: false; error: string };

export async function sealCapsule(message: string, openOn: string): Promise<SealResult> {
  const me = await myCouple();
  if (!me) return { ok: false, error: "Sign in and pair up first." };
  const text = message.trim();
  if (!text) return { ok: false, error: "Write something to seal." };
  if (text.length > MAX_LEN) return { ok: false, error: `Keep it under ${MAX_LEN} characters.` };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(openOn)) return { ok: false, error: "Pick a date." };
  const date = new Date(openOn + "T00:00:00.000Z");
  const today = todayUTC();
  const days = (date.getTime() - today.getTime()) / 86_400_000;
  if (!(days >= 7)) return { ok: false, error: "Pick a date at least a week away." };
  if (days > 366 * 25) return { ok: false, error: "Pick a date within 25 years." };

  const sealed = await prisma.timeCapsule.count({
    where: { relationshipId: me.relationshipId, openOn: { gt: today } },
  });
  if (sealed >= MAX_SEALED) return { ok: false, error: "That's a lot of sealed capsules. Let one open first." };

  await prisma.timeCapsule.create({
    data: { relationshipId: me.relationshipId, authorId: me.userId, message: text, openOn: date },
  });

  const partnerId = await getPartnerUserId(me.relationshipId, me.userId);
  if (partnerId) {
    const when = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
    void sendPushToUser(partnerId, {
      title: "A time capsule was sealed",
      body: `It opens ${when}. Neither of you can read it until then.`,
      url: "/app/constellation",
    }).catch(() => {});
  }
  revalidatePath("/app/constellation");
  return { ok: true };
}
