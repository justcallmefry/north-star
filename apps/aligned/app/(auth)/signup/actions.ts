"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { trackEvent } from "@/lib/events";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type CreateAccountResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Create a new user with email + password from the signup form.
 *
 * An email that already has an account is always refused, including
 * accounts created by magic link or Sign in with Apple that have no
 * password. This used to "add a password" to such accounts, which let
 * anyone who knew a user's email set a password on their account and sign
 * in as them. Someone who owns a passwordless account signs in the way they
 * created it.
 */
export async function createAccount(
  email: string,
  password: string,
  name: string
): Promise<CreateAccountResult> {
  const normalized = email.trim().toLowerCase();
  const trimmedName = name.trim().slice(0, 100) || null;

  if (!normalized.includes("@") || normalized.length > 254) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (password.length > 200) {
    return { ok: false, error: "Password must be 200 characters or fewer." };
  }

  const ip = clientIp(await headers());
  const limited = await rateLimit(`signup:ip:${ip}`, 10, 60 * 60);
  if (!limited.ok) {
    return { ok: false, error: "Too many sign-up attempts. Try again in a little while." };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });
    if (existing) {
      return { ok: false, error: "An account with this email already exists. Sign in instead." };
    }

    const created = await prisma.user.create({
      data: {
        email: normalized,
        name: trimmedName,
        password: hashPassword(password),
      },
    });
    void trackEvent("signup", { userId: created.id });
    return { ok: true };
  } catch (e) {
    console.error("[signup] createAccount error:", e);
    return { ok: false, error: "Could not create account. Try again." };
  }
}
