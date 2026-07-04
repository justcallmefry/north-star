"use server";

import webPush from "web-push";
import { prisma } from "@/lib/prisma";
import { getActiveMemberIds } from "@/lib/relationship-members";
import { sendApnsToDevice } from "@/lib/apns";

/** Get the partner's user ID (the other active member in the relationship). Returns null if not exactly two members. */
export async function getPartnerUserId(
  relationshipId: string,
  currentUserId: string
): Promise<string | null> {
  const memberIds = await getActiveMemberIds(relationshipId);
  const partnerIds = memberIds.filter((id) => id !== currentUserId);
  return partnerIds.length === 1 ? partnerIds[0]! : null;
}

export type NotifyPayload = {
  title: string;
  body?: string;
  url: string;
};

/**
 * Send a push notification to all of the user's registered devices —
 * both Web Push (browser/PWA) and native APNs (the Capacitor iOS app).
 * The two are independent: a couple using the website and a couple using
 * the App Store app both just work. Returns total number sent.
 */
export async function sendPushToUser(userId: string, payload: NotifyPayload): Promise<number> {
  const [webSent, iosSent] = await Promise.all([
    sendWebPushToUser(userId, payload),
    sendApnsToUser(userId, payload),
  ]);
  return webSent + iosSent;
}

async function sendWebPushToUser(userId: string, payload: NotifyPayload): Promise<number> {
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) return 0;

  webPush.setVapidDetails(
    "mailto:support@alignedconnectingcouples.com",
    vapidPublic,
    vapidPrivate
  );

  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { endpoint: true, p256dhKey: true, authKey: true },
  });

  let sent = 0;
  const payloadStr = JSON.stringify(payload);

  for (const sub of subs) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dhKey,
            auth: sub.authKey,
          },
        },
        payloadStr,
        { TTL: 60 * 60 * 24 } // 24h
      );
      sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("410") || message.includes("404") || message.includes("Gone")) {
        await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
      }
    }
  }

  return sent;
}

async function sendApnsToUser(userId: string, payload: NotifyPayload): Promise<number> {
  if (!process.env.APNS_KEY_P8) return 0;

  const tokens = await prisma.deviceToken.findMany({
    where: { userId, platform: "ios" },
    select: { token: true },
  });

  let sent = 0;
  const stale: string[] = [];

  for (const { token } of tokens) {
    const result = await sendApnsToDevice(token, payload);
    if (result.ok) sent++;
    if (result.shouldRemove) stale.push(token);
  }

  if (stale.length > 0) {
    await prisma.deviceToken.deleteMany({ where: { token: { in: stale } } });
  }

  return sent;
}
