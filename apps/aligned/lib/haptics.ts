"use client";

import { Capacitor } from "@capacitor/core";

type HapticKind = "reveal" | "success" | "tap";

const WEB_PATTERNS: Record<HapticKind, number | number[]> = {
  reveal: [12, 60, 18],
  success: 18,
  tap: 8,
};

export async function haptic(kind: HapticKind): Promise<void> {
  if (typeof window === "undefined") return;

  if (Capacitor.isNativePlatform()) {
    try {
      const mod = await import("@capacitor/haptics");
      const { Haptics, ImpactStyle, NotificationType } = mod;
      if (kind === "reveal") {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else if (kind === "success") {
        await Haptics.notification({ type: NotificationType.Success });
      } else {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
      return;
    } catch {
      // fall through to web fallback
    }
  }

  const nav = window.navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof nav.vibrate === "function") {
    try {
      nav.vibrate(WEB_PATTERNS[kind]);
    } catch {
      // ignore
    }
  }
}
