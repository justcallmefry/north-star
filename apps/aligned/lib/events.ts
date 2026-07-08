import { prisma } from "@/lib/prisma";

/**
 * Minimal funnel tracking. Four events are enough to see where couples
 * fall out: signup → paired → first_reveal → checkout_started.
 * Never throws and never blocks the caller's flow — call as
 * `void trackEvent(...)`.
 *
 * Query later with plain SQL/Prisma (e.g. weekly counts per type, or
 * signup→paired conversion by joining on userId within 7 days).
 */
export type AppEventType = "signup" | "paired" | "first_reveal" | "checkout_started";

export async function trackEvent(
  type: AppEventType,
  ids: { userId?: string; relationshipId?: string } = {}
): Promise<void> {
  try {
    await prisma.appEvent.create({
      data: {
        type,
        userId: ids.userId ?? null,
        relationshipId: ids.relationshipId ?? null,
      },
    });
  } catch (err) {
    console.error(`[events] failed to record ${type}:`, err);
  }
}
