import type { NextRequest } from "next/server";
import { getHandlers } from "@/lib/auth";
import { sendMagicLinkWithKey } from "@/lib/email";

export const dynamic = "force-dynamic";

// Sender defined here so process.env is read in the route chunk (where RESEND_API_KEY is available at runtime).
function sendVerificationRequestFromRoute(params: Parameters<typeof sendMagicLinkWithKey>[0]) {
  return sendMagicLinkWithKey(params, process.env.RESEND_API_KEY);
}

export async function GET(req: NextRequest) {
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasSmtp = !!process.env.EMAIL_SERVER;
  console.log(
    "[auth] Email config: RESEND_API_KEY=" + (hasResend ? "set" : "missing") + ", EMAIL_SERVER=" + (hasSmtp ? "set" : "missing")
  );
  const handlers = getHandlers(sendVerificationRequestFromRoute);
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasSmtp = !!process.env.EMAIL_SERVER;
  console.log(
    "[auth] Email config: RESEND_API_KEY=" + (hasResend ? "set" : "missing") + ", EMAIL_SERVER=" + (hasSmtp ? "set" : "missing")
  );
  const handlers = getHandlers(sendVerificationRequestFromRoute);
  return handlers.POST(req);
}
