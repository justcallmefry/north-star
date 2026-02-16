"use server";

import { prisma } from "@/lib/prisma";

export async function submitBetaSignup(email: string): Promise<{ ok: boolean; message: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false, message: "Please enter your email." };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return { ok: false, message: "Please enter a valid email." });

  try {
    await prisma.betaSignup.upsert({
      where: { email: trimmed },
      create: { email: trimmed },
      update: {}, // already signed up
    });
    return { ok: true, message: "You're on the list. We'll be in touch when a spot opens." };
  } catch (e) {
    console.error("Beta signup error:", e);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}
