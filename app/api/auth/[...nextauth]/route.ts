import type { NextRequest } from "next/server";
import { getHandlers } from "@/lib/auth";
import { sendMagicLinkWithKey } from "@/lib/email";
import { setEmailEnv } from "@/lib/email-env";

export const dynamic = "force-dynamic";

/** Ensure magic links use the real deployment URL. Vercel sets VERCEL_URL; if AUTH_URL/NEXTAUTH_URL is wrong or a placeholder, override it here so callbacks work. */
function ensureAuthUrl() {
  const vercelUrl = process.env.VERCEL_URL;
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  const isPlaceholder =
    !authUrl || authUrl.includes("your-main-url") || authUrl.includes("your-app.vercel");
  if (vercelUrl && isPlaceholder) {
    process.env.AUTH_URL = `https://${vercelUrl}`;
  }
}

const hasResend = () => !!process.env.RESEND_API_KEY;
const hasSmtp = () => !!process.env.EMAIL_SERVER;

// Sender defined here so process.env is read in the route chunk (where RESEND_API_KEY is available at runtime).
function sendVerificationRequestFromRoute(params: Parameters<typeof sendMagicLinkWithKey>[0]) {
  return sendMagicLinkWithKey(params, process.env.RESEND_API_KEY);
}

function getEmailConfig() {
  const resend = hasResend();
  const smtp = hasSmtp();
  const emailConfigured = resend || smtp;
  if (emailConfigured) {
    setEmailEnv({
      resendApiKey: process.env.RESEND_API_KEY,
      emailServer: process.env.EMAIL_SERVER,
      nodeEnv: process.env.NODE_ENV,
    });
  }
  // Use Resend's free sender when using Resend and no custom EMAIL_FROM is set
  const defaultFrom =
    resend && !process.env.EMAIL_FROM ? "onboarding@resend.dev" : undefined;
  return { emailConfigured, resend, smtp, defaultFrom };
}

export async function GET(req: NextRequest) {
  ensureAuthUrl();
  const { emailConfigured, resend, smtp, defaultFrom } = getEmailConfig();
  console.log(
    "[auth] Email config: RESEND_API_KEY=" + (resend ? "set" : "missing") + ", EMAIL_SERVER=" + (smtp ? "set" : "missing")
  );
  const handlers = getHandlers(sendVerificationRequestFromRoute, { emailConfigured, defaultFrom });
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  ensureAuthUrl();
  const { emailConfigured, resend, smtp, defaultFrom } = getEmailConfig();
  console.log(
    "[auth] Email config: RESEND_API_KEY=" + (resend ? "set" : "missing") + ", EMAIL_SERVER=" + (smtp ? "set" : "missing")
  );
  const handlers = getHandlers(sendVerificationRequestFromRoute, { emailConfigured, defaultFrom });
  return handlers.POST(req);
}
