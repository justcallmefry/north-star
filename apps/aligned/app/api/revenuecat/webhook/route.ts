import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SubscriptionStatus } from "@/generated/prisma";

/**
 * RevenueCat webhook — Apple in-app purchases for the iOS app.
 *
 * Apple requires IAP for digital subscriptions bought inside the app
 * (Guideline 3.1.1), so the app cannot use the Stripe checkout the website
 * uses. RevenueCat sits in front of StoreKit and posts lifecycle events
 * here; we translate them into the same Subscription rows Stripe produces,
 * so lib/entitlements.ts needs no knowledge of where a purchase came from.
 *
 * Setup: in RevenueCat, set the webhook URL to
 *   https://alignedconnectingcouples.com/api/revenuecat/webhook
 * with an Authorization header value matching REVENUECAT_WEBHOOK_SECRET.
 *
 * app_user_id must be our User.id — the client sets it via Purchases.logIn
 * after sign-in, which is what lets an event map back to an account.
 */

export const dynamic = "force-dynamic";

type RevenueCatEvent = {
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  product_id?: string;
  period_type?: string;
  expiration_at_ms?: number | null;
  store?: string;
};

/**
 * RevenueCat event types mapped onto our four statuses.
 *
 * CANCELLATION means auto-renew was switched off, not that access ended —
 * the subscription stays usable until expiration, so it maps to active
 * with cancelAtPeriodEnd. EXPIRATION is the event that actually revokes.
 */
function statusFor(eventType: string, periodType?: string): SubscriptionStatus | null {
  switch (eventType) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
    case "PRODUCT_CHANGE":
    case "SUBSCRIPTION_EXTENDED":
      return periodType === "TRIAL" ? "trialing" : "active";
    case "CANCELLATION":
      return "active";
    case "EXPIRATION":
    case "SUBSCRIPTION_PAUSED":
      return "canceled";
    case "BILLING_ISSUE":
      return "past_due";
    default:
      return null; // TEST, TRANSFER, NON_RENEWING_PURCHASE etc. — ignored
  }
}

export async function POST(request: Request) {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  // RevenueCat sends whatever literal string you configure, so accept it
  // with or without a Bearer prefix.
  const authorization = request.headers.get("authorization") ?? "";
  const presented = authorization.replace(/^Bearer\s+/i, "");
  if (presented !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { event?: RevenueCatEvent };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event;
  if (!event?.type) {
    return NextResponse.json({ error: "Missing event" }, { status: 400 });
  }

  const status = statusFor(event.type, event.period_type);
  if (!status) {
    // Acknowledged so RevenueCat stops retrying an event we don't act on.
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const appUserId = event.app_user_id ?? event.original_app_user_id;
  if (!appUserId) {
    return NextResponse.json({ error: "Missing app_user_id" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: appUserId },
    select: { id: true },
  });
  if (!user) {
    // 200, not 404: an unknown id is not something retrying will fix, and
    // RevenueCat would keep hammering the endpoint.
    console.warn("[revenuecat] no user for app_user_id", appUserId, event.type);
    return NextResponse.json({ ok: true, unmatched: true });
  }

  // Attach to the relationship as well, so the partner is covered even
  // though only one Apple ID paid.
  const membership = await prisma.relationshipMember.findFirst({
    where: { userId: user.id, leftAt: null },
    select: { relationshipId: true },
  });

  const currentPeriodEnd = event.expiration_at_ms
    ? new Date(event.expiration_at_ms)
    : null;

  const data = {
    userId: user.id,
    relationshipId: membership?.relationshipId ?? null,
    provider: "apple",
    revenueCatUserId: appUserId,
    productId: event.product_id ?? null,
    status,
    currentPeriodEnd,
    cancelAtPeriodEnd: event.type === "CANCELLATION",
  };

  // One Apple subscription per user: update the existing row rather than
  // accumulating one per renewal event.
  const existing = await prisma.subscription.findFirst({
    where: { userId: user.id, provider: "apple" },
    select: { id: true },
  });

  if (existing) {
    await prisma.subscription.update({ where: { id: existing.id }, data });
  } else {
    await prisma.subscription.create({ data });
  }

  return NextResponse.json({ ok: true, type: event.type, status });
}
