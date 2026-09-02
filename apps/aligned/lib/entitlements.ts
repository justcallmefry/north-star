"use server";

import { prisma } from "@/lib/prisma";
import { getActiveMemberIds } from "@/lib/relationship-members";

/**
 * Entitlement gate for premium features (Magazine, Keepsake, full history).
 *
 * PRICING (decided 2026-07-03): 14-day free trial, then $29.99/year, and
 * one subscription covers both partners.
 *
 * TWO PAYMENT PATHS, deliberately:
 *   - Website  -> Stripe. ~2.9%, and Apple has no claim on it.
 *   - iOS app  -> Apple in-app purchase, relayed by RevenueCat. Required:
 *     selling a digital subscription inside the app any other way is an
 *     App Store Guideline 3.1.1 rejection. See lib/native.ts, which keeps
 *     the Stripe path out of the app entirely.
 * Either way a Subscription row lands here and the check below is the same.
 *
 * BETA POLICY (still current): everyone is premium until the paywall is
 * turned on — delete the early return below and every gate goes live.
 */

export type Entitlement = "premium";

/**
 * Does an active subscription exist for this user, or for anyone they
 * share a relationship with?
 *
 * The partner clause is the point: an Apple purchase is tied to the Apple
 * ID that paid, but the product promise is that one subscription covers
 * the couple. Resolving through the relationship keeps that true no matter
 * which partner bought it, and on which platform.
 */
async function hasActiveSubscription(userId: string): Promise<boolean> {
  const memberships = await prisma.relationshipMember.findMany({
    where: { userId, leftAt: null },
    select: { relationshipId: true },
  });
  const relationshipIds = memberships.map((m) => m.relationshipId);

  // Everyone whose subscription should cover this user: themselves, plus
  // the other active members of any relationship they're in.
  const coveringUserIds = new Set<string>([userId]);
  for (const relationshipId of relationshipIds) {
    for (const memberId of await getActiveMemberIds(relationshipId)) {
      coveringUserIds.add(memberId);
    }
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      status: { in: ["active", "trialing"] },
      OR: [
        { userId: { in: [...coveringUserIds] } },
        relationshipIds.length > 0 ? { relationshipId: { in: relationshipIds } } : {},
      ],
    },
    select: { currentPeriodEnd: true },
  });

  if (!subscription) return false;
  if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) return false;
  return true;
}

export async function hasEntitlement(
  userId: string,
  entitlement: Entitlement
): Promise<boolean> {
  // BETA: free for everyone. Remove this line when paid plans go live.
  if (entitlement === "premium") return true;

  return hasActiveSubscription(userId);
}

export async function isPremium(userId: string): Promise<boolean> {
  return hasEntitlement(userId, "premium");
}

/**
 * The real check, ignoring the beta override. Use this to show subscription
 * state in the UI ("you're subscribed", renewal date) without accidentally
 * telling every beta user they have paid.
 */
export async function hasPaidSubscription(userId: string): Promise<boolean> {
  return hasActiveSubscription(userId);
}
