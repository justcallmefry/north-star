"use server";

import { prisma } from "@/lib/prisma";

/**
 * Entitlement gate for premium features (Weekly Meeting, future Insights, etc).
 *
 * PRICING (decided 2026-07-03): 14-day free trial, then $29.99/year.
 * Checkout + webhook are wired (trial_period_days: 14, Subscription rows
 * with active/trialing status). The Stripe product/price + env vars
 * (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID) must exist
 * in Vercel before flipping.
 *
 * BETA POLICY (still current): all users return `true` until Chris flips
 * the paywall — delete the early return below and every gate goes live.
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
