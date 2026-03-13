"use client";

/** Base64url to Uint8Array for VAPID key. Uses ArrayBuffer so Push API accepts it. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

const SW_URL = "/push-sw.js";

/** Register the push service worker. Returns the registration or null. */
export async function registerPushSw(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
    await reg.update();
    return reg;
  } catch {
    return null;
  }
}

/** Request notification permission and subscribe to push. Posts subscription to API. Returns true if we have a valid subscription. */
export async function requestPermissionAndSubscribe(): Promise<boolean> {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublic) return false;

  if (typeof navigator === "undefined" || !("Notification" in navigator)) return false;
  if (Notification.permission === "denied") return false;

  let permission: NotificationPermission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") return false;

  const reg = await registerPushSw();
  if (!reg || !reg.pushManager) return false;

  try {
    const vapidKey = urlBase64ToUint8Array(vapidPublic);
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey as BufferSource,
    });
    const payload = sub.toJSON();
    if (!payload.endpoint || !payload.keys?.p256dh || !payload.keys?.auth) return false;

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: payload.endpoint,
        keys: { p256dh: payload.keys.p256dh, auth: payload.keys.auth },
        userAgent: navigator.userAgent,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** If we already have a push subscription (from a previous permission grant), return true. Does not prompt. */
export async function hasPushSubscription(): Promise<boolean> {
  const reg = await registerPushSw();
  if (!reg?.pushManager) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}
