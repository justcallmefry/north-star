"use server";

import { prisma } from "@/lib/prisma";
import { getActiveMemberIds } from "@/lib/relationship-members";
import { sendPushToUser } from "@/lib/push";

/**
 * Automatic partner-lifecycle notifications — the three moments where one
 * partner's action needs to become visible to the other one, immediately.
 *
 * Without these, the couple's loop is invisible between them: the daily
 * reminder cron only catches up the next day, and the "Notify" button
 * requires the person to remember to press it. These fire on their own.
 *
 * All three are fire-and-forget (`void notify…()` at the call site) and
 * swallow their own errors — a push failure must never break a signup,
 * a pairing, or an answer being saved.
 */

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://alignedconnectingcouples.com";
}

function firstNameOf(name: string | null | undefined): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
}

/** Everyone in the relationship except the person who just acted. */
async function otherMemberIds(
  relationshipId: string,
  actingUserId: string
): Promise<string[]> {
  const memberIds = await getActiveMemberIds(relationshipId);
  return memberIds.filter((id) => id !== actingUserId);
}

/**
 * The partner accepted the invite and is now in the space.
 *
 * This is the single most important notification in the product: until it
 * lands, the inviter has no idea whether their invite was ignored, lost in
 * a text thread, or accepted. Sent to whoever was already here.
 */
export async function notifyPartnerJoined(
  relationshipId: string,
  joiningUserId: string
): Promise<void> {
  try {
    const recipients = await otherMemberIds(relationshipId, joiningUserId);
    if (recipients.length === 0) return;

    const joiner = await prisma.user.findUnique({
      where: { id: joiningUserId },
      select: { name: true },
    });
    const name = firstNameOf(joiner?.name);

    // Did the waiting partner already leave a sealed answer? If so, that's
    // the warmer thing to say — their showing up early just paid off.
    const sealedWaiting = await prisma.response.count({
      where: {
        session: { relationshipId, state: "open" },
        userId: { in: recipients },
      },
    });

    const title = name ? `${name} is here.` : "Your partner is here.";
    const body =
      sealedWaiting > 0
        ? "Your answer was waiting for them. Now you can open it together."
        : "You're paired. Tonight's question is ready when you are.";

    await Promise.all(
      recipients.map((userId) =>
        sendPushToUser(userId, { title, body, url: `${appUrl()}/app` })
      )
    );
  } catch {
    // Never let a push failure break pairing.
  }
}

/**
 * The partner answered today's question.
 *
 * Two shapes, because the moment means different things:
 *  - they answered first  → "your turn", the answer is sealed and waiting
 *  - they answered second → the reveal is unlocked, go open it together
 *
 * Only fires on a first submission, never on an edit (see submitResponse).
 */
export async function notifyPartnerAnswered(params: {
  relationshipId: string;
  sessionId: string;
  answeringUserId: string;
  revealReady: boolean;
}): Promise<void> {
  const { relationshipId, sessionId, answeringUserId, revealReady } = params;
  try {
    const recipients = await otherMemberIds(relationshipId, answeringUserId);
    if (recipients.length === 0) return;

    const answerer = await prisma.user.findUnique({
      where: { id: answeringUserId },
      select: { name: true },
    });
    const name = firstNameOf(answerer?.name);

    const payload = revealReady
      ? {
          title: "You're both in.",
          body: "Tap to see what they wrote.",
        }
      : {
          title: name ? `${name} answered.` : "They answered — your turn.",
          body: "Their answer is sealed until you write yours.",
        };

    const url = `${appUrl()}/app/session/${sessionId}`;

    await Promise.all(
      recipients.map((userId) => sendPushToUser(userId, { ...payload, url }))
    );
  } catch {
    // Never let a push failure break an answer being saved.
  }
}
