import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { trackEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stripe) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      // 14 days free: long enough for two Sunday magazines and one full
      // golden-week attempt — the couple should have a sky worth keeping
      // before we ever ask for money.
      subscription_data: { trial_period_days: 14 },
      allow_promotion_codes: true,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/upgrade?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/upgrade?canceled=true`,
      customer_email: session.user.email ?? undefined,
      metadata: { userId: session.user.id },
    });

    void trackEvent("checkout_started", { userId: session.user.id });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
