import type { NextRequest } from "next/server";
import { getHandlers } from "@/lib/auth";
import { sendMagicLinkWithKey } from "@/lib/email";
import { setEmailEnv } from "@/lib/email-env";

export const dynamic = "force-dynamic";

/** Ensure redirects use the URL you're actually on. On localhost we use the request host so port 3000 vs 3003 doesn't matter. On Vercel we use VERCEL_URL when env is a placeholder. */
function ensureAuthUrl(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const requestOrigin = host ? `${proto}://${host}` : "";

  // Localhost: always use the port the user is actually visiting so callbacks stay on the same port
  if (host && (host.startsWith("localhost") || host.startsWith("127.0.0.1"))) {
    process.env.AUTH_URL = requestOrigin;
    process.env.NEXTAUTH_URL = requestOrigin;
    process.env.AUTH_TRUST_HOST = "true";
    return;
  }

  const vercelUrl = process.env.VERCEL_URL;
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  const isPlaceholder =
    !authUrl || authUrl.includes("your-main-url") || authUrl.includes("your-app.vercel");
  if (vercelUrl && isPlaceholder) {
    process.env.AUTH_URL = `https://${vercelUrl}`;
    process.env.NEXTAUTH_URL = `https://${vercelUrl}`;
  }
}

const hasResend = () => !!process.env.RESEND_API_KEY;
const hasSmtp = () => !!process.env.EMAIL_SERVER;

// Sender defined here so process.env is read in the route chunk (where RESEND_API_KEY is available at runtime).
async function sendVerificationRequestFromRoute(params: Parameters<typeof sendMagicLinkWithKey>[0]) {
  try {
    await sendMagicLinkWithKey(params, process.env.RESEND_API_KEY);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const details = err instanceof Error ? err.stack : undefined;
    console.error("[auth] Magic link send failed:", message, details ?? "");
    throw err;
  }
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
  // Use route's process.env so Vercel EMAIL_FROM is used at runtime (required for Resend to send to non-owner emails)
  const from =
    process.env.EMAIL_FROM ?? (resend ? "onboarding@resend.dev" : undefined) ?? "noreply@example.com";
  return { emailConfigured, resend, smtp, from };
}

export async function GET(req: NextRequest) {
  ensureAuthUrl(req);
  const { emailConfigured, resend, smtp, from } = getEmailConfig();
  console.log(
    "[auth] Email config: RESEND_API_KEY=" + (resend ? "set" : "missing") +
    ", EMAIL_SERVER=" + (smtp ? "set" : "missing") +
    ", EMAIL_FROM=" + (process.env.EMAIL_FROM ? process.env.EMAIL_FROM : "not set (using " + from + ")")
  );
  const handlers = getHandlers(sendVerificationRequestFromRoute, { emailConfigured, from });
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  ensureAuthUrl(req);
  const { emailConfigured, resend, smtp, from } = getEmailConfig();
  console.log(
    "[auth] Email config: RESEND_API_KEY=" + (resend ? "set" : "missing") +
    ", EMAIL_SERVER=" + (smtp ? "set" : "missing") +
    ", EMAIL_FROM=" + (process.env.EMAIL_FROM ? process.env.EMAIL_FROM : "not set (using " + from + ")")
  );
  const handlers = getHandlers(sendVerificationRequestFromRoute, { emailConfigured, from });
  return handlers.POST(req);
}
