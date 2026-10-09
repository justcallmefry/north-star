import { NextResponse } from "next/server";
import { isNativeRequest } from "@/lib/native";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Opens Stripe's hosted billing portal so a website subscriber can cancel,
 * change card, or see invoices themselves. Cancelling must be as easy as
 * subscribing; before this the only way out was emailing us.
 */
export async function POST() {
  // App Store subscriptions are managed in iOS Settings, never here.
  if (await isNativeRequest()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!stripe) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
  }

  const sub = await prisma.subscription.findFirst({
    where: { userId: session.user.id, provider: "stripe", stripeCustomerId: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: { stripeCustomerId: true },
  });
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: "No website subscription" }, { status: 404 });
  }

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/us`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error("[stripe/portal]", err);
    return NextResponse.json({ error: "Could not open billing" }, { status: 500 });
  }
}
