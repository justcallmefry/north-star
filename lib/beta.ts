"use server";

import { prisma } from "@/lib/prisma";
import { sendBetaConfirmation } from "@/lib/email";

function getAppUrl(): string {
  if (process.env["VERCEL_URL"]) return `https://${process.env["VERCEL_URL"]}`;
  if (process.env["NEXT_PUBLIC_APP_URL"]) return process.env["NEXT_PUBLIC_APP_URL"];
  return "https://north-star-hazel.vercel.app";
}

export async function submitBetaSignup(email: string): Promise<{ ok: boolean; message: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false, message: "Please enter your email." };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return { ok: false, message: "Please enter a valid email." };

  try {
    await prisma.betaSignup.upsert({
      where: { email: trimmed },
      create: { email: trimmed },
      update: {}, // already signed up
    });
    const appUrl = getAppUrl();
    let emailSent = false;
    let emailError: string | null = null;
    try {
      emailSent = await sendBetaConfirmation(trimmed, appUrl);
    } catch (emailErr) {
      console.error("Beta confirmation email failed:", emailErr);
      emailError = emailErr instanceof Error ? emailErr.message : String(emailErr);
    }
    if (emailSent) {
      return { ok: true, message: "You're on the list. Check your email for a link to sign in and start using the app." };
    }
    if (emailError) {
      return { ok: true, message: `You're on the list, but the confirmation email couldn't be sent (${emailError}). You can sign in anytime at ${appUrl}/login with this email.` };
    }
    return { ok: true, message: `You're on the list. Email isn't set up yet, so no confirmation was sent. You can sign in anytime at ${appUrl}/login with this email.` };
  } catch (e) {
    console.error("Beta signup error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    // Show actual error so we can fix (e.g. table missing, connection, etc.)
    return { ok: false, message: msg || "Something went wrong. Please try again." };
  }
}
