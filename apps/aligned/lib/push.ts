"use server";

import { ApnsClient, Notification } from "apns2";
import webPush from "web-push";
import { prisma } from "@/lib/prisma";
import { getActiveMemberIds } from "@/lib/relationship-members";

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

function getApnsClient(): ApnsClient | null {
  const teamId = process.env.APNS_TEAM_ID;
  const keyId = process.env.APNS_KEY_ID;
  const topic = process.env.APNS_TOPIC; // bundle id, e.g. com.alignedconnectingcouples.app
  const keyP8 = process.env.APNS_KEY_P8 ?? (process.env.APNS_KEY_P8_BASE64 ? Buffer.from(process.env.APNS_KEY_P8_BASE64, "base64").toString("utf8") : undefined);
  if (!teamId || !keyId || !topic || !keyP8) return null;
  const signingKey = Buffer.from(keyP8.replace(/\\n/g, "\n"), "utf8");
  const isSandbox = process.env.APNS_SANDBOX === "true";
  return new ApnsClient({
    team: teamId,
    keyId,
    signingKey,
    defaultTopic: topic,
    host: isSandbox ? "api.sandbox.push.apple.com" : "api.push.apple.com",
  });
}

/** Send to native iOS devices via APNs. Returns number sent. Invalid tokens are removed. */
async function sendNativePushToUser(userId: string, payload: NotifyPayload): Promise<number> {
  const client = getApnsClient();
  if (!client) return 0;

  const tokens = await prisma.nativePushToken.findMany({
    where: { userId, platform: "ios" },
    select: { id: true, token: true },
  });
  if (tokens.length === 0) return 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const url = payload.url.startsWith("http") ? payload.url : `${appUrl}${payload.url}`;
  let sent = 0;
  const toDelete: string[] = [];

  for (const row of tokens) {
    try {
      const notification = new Notification(row.token, {
        alert: {
          title: payload.title,
          body: payload.body ?? "",
        },
        sound: "default",
        data: { url },
        mutableContent: true,
      });
      await client.send(notification);
      sent++;
    } catch (err: unknown) {
      const reason = (err as { reason?: string })?.reason ?? String(err);
      if (reason === "BadDeviceToken" || reason === "Unregistered" || reason === "DeviceTokenNotForTopic") {
        toDelete.push(row.id);
      }
    }
  }

  if (toDelete.length > 0) {
    await prisma.nativePushToken.deleteMany({ where: { id: { in: toDelete } } });
  }
  return sent;
}

/** Send a push notification to all of the user's registered devices (web + native). Returns number sent. */
export async function sendPushToUser(userId: string, payload: NotifyPayload): Promise<number> {
  let sent = 0;

  // Web push (browser / PWA)
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (vapidPublic && vapidPrivate) {
    webPush.setVapidDetails(
      "mailto:support@alignedconnectingcouples.com",
      vapidPublic,
      vapidPrivate
    );
    const subs = await prisma.pushSubscription.findMany({
      where: { userId },
      select: { endpoint: true, p256dhKey: true, authKey: true },
    });
    const payloadStr = JSON.stringify(payload);
    for (const sub of subs) {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dhKey, auth: sub.authKey },
          },
          payloadStr,
          { TTL: 60 * 60 * 24 }
        );
        sent++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("410") || message.includes("404") || message.includes("Gone")) {
          await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
        }
      }
    }
  }

  // Native iOS (APNs)
  sent += await sendNativePushToUser(userId, payload);

  return sent;
}
