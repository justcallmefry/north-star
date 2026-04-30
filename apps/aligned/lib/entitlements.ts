"use server";

import { prisma } from "@/lib/prisma";

/**
 * Entitlement gate for premium features (Weekly Meeting, future Insights, etc).
 *
 * BETA POLICY (current): all users return `true`. We surface premium-tier
 * features now to gather feedback; no payment infrastructure is wired yet.
 *
 * When StoreKit / Google Billing lands, replace the early `return true` with
 * the real subscription check (already wired below — kept compiled and tested
 * so the flip is one line).
 */

export type Entitlement = "premium";

export async function hasEntitlement(
  userId: string,
  entitlement: Entitlement
): Promise<boolean> {
  // BETA: free for everyone. Remove this line when paid plans go live.
  if (entitlement === "premium") return true;

  // Real check (kept warm for the StoreKit cutover):
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["active", "trialing"] },
    },
    select: { id: true, currentPeriodEnd: true },
  });
  if (!sub) return false;
  if (sub.currentPeriodEnd && sub.currentPeriodEnd < new Date()) return false;
  return true;
}

export async function isPremium(userId: string): Promise<boolean> {
  return hasEntitlement(userId, "premium");
}
