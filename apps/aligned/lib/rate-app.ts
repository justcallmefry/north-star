"use client";

import { Capacitor } from "@capacitor/core";

/**
 * Ask for an App Store rating — but only at golden moments, only in the
 * native app, and at most once every 120 days. iOS additionally rations
 * the system dialog (3x/year max) and may silently not show it; we just
 * pick the moments and stay far under the OS budget.
 *
 * Golden moments (callers): an ✨ aligned reveal, streak day 7, a golden
 * week completing. Never ask after a miss, a reset, or anything neutral —
 * the couple should be mid-warm-glow when the dialog appears.
 */

const LAST_ASKED_KEY = "rate-app-last-asked";
const MIN_DAYS_BETWEEN_ASKS = 120;

export async function maybeRequestReview(): Promise<void> {
  try {
    if (!Capacitor.isNativePlatform()) return;

    const last = localStorage.getItem(LAST_ASKED_KEY);
    if (last) {
      const daysSince = (Date.now() - Number(last)) / (1000 * 60 * 60 * 24);
      if (Number.isFinite(daysSince) && daysSince < MIN_DAYS_BETWEEN_ASKS) return;
    }

    const { InAppReview } = await import("@capacitor-community/in-app-review");
    await InAppReview.requestReview();
    localStorage.setItem(LAST_ASKED_KEY, String(Date.now()));
  } catch {
    // A failed/suppressed review prompt should never affect the moment
    // the user is having.
  }
}
