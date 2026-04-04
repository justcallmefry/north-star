"use server";

import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { stripe } from "@/lib/stripe";
import { isProfileImageUrl } from "@/app/app/us/profile-image";

export type DeleteAccountResult = { ok: true } | { ok: false; error: string };

/**
 * Permanently delete the signed-in user and cascaded data. Best-effort Stripe cancel + Blob cleanup.
 */
export async function deleteMyAccount(
  confirmEmail: string,
  currentPassword: string | null
): Promise<DeleteAccountResult> {
  const session = await getServerAuthSession();
  if (!session?.user?.id || !session.user.email) {
    return { ok: false, error: "Not signed in." };
  }

  const emailOk =
    confirmEmail.trim().toLowerCase() === session.user.email.trim().toLowerCase();
  if (!emailOk) {
    return { ok: false, error: "Email must match your sign-in email." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true, image: true },
  });
  if (!user) return { ok: false, error: "User not found." };

  if (user.password) {
    if (!currentPassword?.trim()) {
      return { ok: false, error: "Enter your password to delete your account." };
    }
    if (!verifyPassword(currentPassword.trim(), user.password)) {
      return { ok: false, error: "Password is incorrect." };
    }
  }

  const subs = await prisma.subscription.findMany({
    where: {
      userId: session.user.id,
      stripeSubscriptionId: { not: null },
      status: { in: ["active", "trialing", "past_due"] },
    },
    select: { stripeSubscriptionId: true },
  });

  if (stripe) {
    for (const s of subs) {
      if (!s.stripeSubscriptionId) continue;
      try {
        await stripe.subscriptions.cancel(s.stripeSubscriptionId);
      } catch (err) {
        console.error("Stripe subscription cancel failed:", err);
      }
    }
  }

  if (
    user.image &&
    isProfileImageUrl(user.image) &&
    user.image.includes("blob.vercel-storage.com") &&
    process.env.BLOB_READ_WRITE_TOKEN
  ) {
    try {
      await del(user.image);
    } catch {
      // ignore
    }
  }

  await prisma.user.delete({ where: { id: session.user.id } });

  return { ok: true };
}
