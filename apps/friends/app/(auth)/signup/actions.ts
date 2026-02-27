"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export type CreateAccountResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Create a new user with email + password, or add a password to an existing
 * magic-link-only user. Used when signing up from the signup form.
 */
export async function createAccount(
  email: string,
  password: string,
  name: string
): Promise<CreateAccountResult> {
  const normalized = email.trim().toLowerCase();
  const trimmedName = name.trim().slice(0, 100) || null;

  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const hashed = hashPassword(password);

  try {
    const existing = await prisma.user.findUnique({
      where: { email: normalized },
    });

    if (existing) {
      if (existing.password) {
        return { ok: false, error: "An account with this email already exists. Log in instead." };
      }
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          password: hashed,
          name: trimmedName ?? existing.name,
        },
      });
      return { ok: true };
    }

    await prisma.user.create({
      data: {
        email: normalized,
        name: trimmedName,
        password: hashed,
      },
    });
    return { ok: true };
  } catch (e) {
    console.error("[signup] createAccount error:", e);
    return { ok: false, error: "Could not create account. Try again." };
  }
}
