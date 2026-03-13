"use client";

import { useEffect } from "react";

/**
 * When the app runs inside the native iOS/Android shell (Capacitor), register the device
 * for push notifications and send the token to our API so the server can send APNs/FCM.
 * No-op when running in a normal browser.
 */
export function NativePushRegistration() {
  useEffect(() => {
    const w = typeof window === "undefined" ? undefined : window as Window & { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } };
    if (!w?.Capacitor?.isNativePlatform?.()) return;

    let cancelled = false;
    const platform = w.Capacitor?.getPlatform?.() === "ios" ? "ios" : "android";

    void (async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== "granted" || cancelled) return;
        await PushNotifications.register();
        PushNotifications.addListener(
          "registration",
          async (ev: { value: string }) => {
            if (cancelled) return;
            const token = ev.value;
            if (!token) return;
            try {
              await fetch("/api/push/register-device", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, platform }),
                credentials: "include",
              });
            } catch {
              // ignore
            }
          },
        );
      } catch {
        // Not in native or plugin failed; ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
