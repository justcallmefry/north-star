"use client";

import { Capacitor } from "@capacitor/core";

type HapticKind =
  | "reveal"
  | "success"
  | "tap"
  | "react-heart"
  | "react-soft"
  | "react-laugh"
  | "react-mark"
  | "react-fire";

const WEB_PATTERNS: Record<HapticKind, number | number[]> = {
  reveal: [12, 60, 18],
  success: 18,
  tap: 8,
  "react-heart": [15, 60, 15],
  "react-soft": [40],
  "react-laugh": [10, 50, 10, 50, 10],
  "react-mark": [25],
  "react-fire": [50],
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
      } else if (kind === "react-heart") {
        await Haptics.impact({ style: ImpactStyle.Light });
        // setTimeout fire-and-forget — second impact follows the first.
        setTimeout(() => { void Haptics.impact({ style: ImpactStyle.Light }); }, 80);
      } else if (kind === "react-laugh") {
        await Haptics.impact({ style: ImpactStyle.Light });
        setTimeout(() => { void Haptics.impact({ style: ImpactStyle.Light }); }, 60);
        setTimeout(() => { void Haptics.impact({ style: ImpactStyle.Light }); }, 120);
      } else if (kind === "react-mark") {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else if (kind === "react-fire") {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (kind === "react-soft") {
        await Haptics.impact({ style: ImpactStyle.Light });
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
