"use client";

import { Capacitor } from "@capacitor/core";

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

/**
 * Native path — the Capacitor-wrapped iOS app runs in a WKWebView, which
 * has no browser Push API at all, so it can't use the web path below.
 * Dynamically imported: web builds never need this plugin's JS.
 *
 * Listeners are attached once per page load. They used to be added on
 * every registration attempt, which leaked a listener each time.
 */
const TOKEN_STORAGE_KEY = "aligned:apns-token";
let nativeListenersReady: Promise<void> | null = null;
let pendingRegistration: ((ok: boolean) => void) | null = null;

/** Follow a notification's link, staying on our own domain. */
function openInApp(url: string) {
  try {
    const parsed = new URL(url, window.location.origin);
    const sameSite =
      parsed.origin === window.location.origin ||
      parsed.hostname.endsWith("alignedconnectingcouples.com");
    if (sameSite) window.location.href = parsed.pathname + parsed.search;
  } catch {
    // Malformed URL: ignore rather than navigate somewhere unexpected.
  }
}

function ensureNativeListeners(): Promise<void> {
  if (nativeListenersReady) return nativeListenersReady;
  nativeListenersReady = (async () => {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    await PushNotifications.addListener("registration", async (token) => {
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, token.value);
      } catch {
        // Storage can be unavailable; sign-out cleanup then has nothing to remove.
      }
      let ok = false;
      try {
        // A 401 while signed out is expected: the token binds on the next
        // launch after sign-in.
        const res = await fetch("/api/push/register-device-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: token.value, platform: Capacitor.getPlatform() }),
        });
        ok = res.ok;
      } catch {
        ok = false;
      }
      pendingRegistration?.(ok);
      pendingRegistration = null;
    });

    await PushNotifications.addListener("registrationError", () => {
      pendingRegistration?.(false);
      pendingRegistration = null;
    });

    // Tapping a notification used to just open the app. The APNs payload
    // carries the destination as a top-level `url`, which arrives here as
    // notification data. Capacitor retains this event across a cold launch,
    // so a tap that starts the app is still routed once this listener attaches.
    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const url = (action.notification.data as { url?: unknown } | undefined)?.url;
      if (typeof url === "string" && url) openInApp(url);
    });
  })();
  return nativeListenersReady;
}

async function registerNativeDeviceToken(): Promise<boolean> {
  const { PushNotifications } = await import("@capacitor/push-notifications");

  let status = await PushNotifications.checkPermissions();
  if (status.receive === "prompt" || status.receive === "prompt-with-rationale") {
    status = await PushNotifications.requestPermissions();
  }
  if (status.receive !== "granted") return false;

  await ensureNativeListeners();
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    pendingRegistration = finish;
    void PushNotifications.register();
    // Registration is near-instant on a real device; don't hang forever if it isn't.
    setTimeout(() => finish(false), 8000);
  });
}

/**
 * Run on every app launch. Attaches the tap handler and, when permission
 * was already granted, re-registers so the device token is bound to
 * whoever is signed in now and APNs token rotations are picked up. Never
 * prompts. No-op on the web.
 */
export async function initNativePush(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await ensureNativeListeners();
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const status = await PushNotifications.checkPermissions();
  if (status.receive === "granted") void PushNotifications.register();
}

/**
 * Detach this device from the signed-in account before signing out.
 * Without this the token stayed attached to the previous user, so the next
 * person to use the phone received the first person's notifications.
 * Only this device's token is removed; the user's other devices keep theirs.
 */
export async function unregisterNativeDeviceToken(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    token = null;
  }
  if (!token) return;
  try {
    await fetch("/api/push/unregister-device-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch {
    // Best effort: signing out must never be blocked by a failed cleanup.
  }
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

async function hasNativeRegistration(): Promise<boolean> {
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const status = await PushNotifications.checkPermissions();
  return status.receive === "granted";
}

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
  if (Capacitor.isNativePlatform()) return registerNativeDeviceToken();

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
  if (Capacitor.isNativePlatform()) return hasNativeRegistration();

  const reg = await registerPushSw();
  if (!reg?.pushManager) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}
