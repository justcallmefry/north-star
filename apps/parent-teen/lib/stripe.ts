import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret && process.env.NODE_ENV === "production") {
  throw new Error("STRIPE_SECRET_KEY is required in production");
}

/**
 * Server-side Stripe client. Use in API routes and server components only.
 * In production, STRIPE_SECRET_KEY must be set or this throws.
 */
export const stripe =
  secret ?
    new Stripe(secret, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    })
  : null;

/** Publishable key for client-side (e.g. Checkout, Elements). */
export const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY ?? null;
