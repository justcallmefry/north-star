-- Subscriptions can now originate from Apple in-app purchase (relayed by
-- RevenueCat) as well as Stripe. Purely additive: existing rows keep
-- working and default to the provider they were created under.
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'stripe';
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "revenueCatUserId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "productId" TEXT;

CREATE INDEX IF NOT EXISTS "Subscription_revenueCatUserId_idx" ON "Subscription"("revenueCatUserId");
