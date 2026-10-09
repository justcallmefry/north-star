"use client";

import { useEffect } from "react";
import { initNativePush } from "@/lib/push-client";

/**
 * Attaches native push handling on every app launch: notification taps open
 * the screen they're about, and the device token re-binds to whoever is
 * signed in. No-op on the web.
 */
export function NativePushHandler() {
  useEffect(() => {
    void initNativePush().catch(() => {
      // Push is an enhancement; never let it break a page load.
    });
  }, []);
  return null;
}
