import type { NextRequest } from "next/server";
import { getHandlers } from "@/lib/auth";
import { sendMagicLinkWithKey } from "@/lib/email";
import { setEmailEnv } from "@/lib/email-env";

export const dynamic = "force-dynamic";

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
  const { emailConfigured, resend, smtp, defaultFrom } = getEmailConfig();
  console.log(
    "[auth] Email config: RESEND_API_KEY=" + (resend ? "set" : "missing") + ", EMAIL_SERVER=" + (smtp ? "set" : "missing")
  );
  const handlers = getHandlers(sendVerificationRequestFromRoute, { emailConfigured, defaultFrom });
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  const { emailConfigured, resend, smtp, defaultFrom } = getEmailConfig();
  console.log(
    "[auth] Email config: RESEND_API_KEY=" + (resend ? "set" : "missing") + ", EMAIL_SERVER=" + (smtp ? "set" : "missing")
  );
  const handlers = getHandlers(sendVerificationRequestFromRoute, { emailConfigured, defaultFrom });
  return handlers.POST(req);
}
