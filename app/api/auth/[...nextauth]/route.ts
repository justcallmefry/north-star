import type { NextRequest } from "next/server";
import { setEmailEnv } from "@/lib/email-env";

export const dynamic = "force-dynamic";

function setAuthEmailEnv() {
  setEmailEnv({
    resendApiKey: process.env.RESEND_API_KEY,
    emailServer: process.env.EMAIL_SERVER,
    nodeEnv: process.env.NODE_ENV,
  });
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasSmtp = !!process.env.EMAIL_SERVER;
  console.log(
    "[auth] Email config: RESEND_API_KEY=" + (hasResend ? "set" : "missing") + ", EMAIL_SERVER=" + (hasSmtp ? "set" : "missing")
  );
}

export async function GET(req: NextRequest) {
  setAuthEmailEnv();
  const { handlers } = await import("@/lib/auth");
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  setAuthEmailEnv();
  const { handlers } = await import("@/lib/auth");
  return handlers.POST(req);
}
