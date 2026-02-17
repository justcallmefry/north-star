import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function logAuthEnv() {
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasSmtp = !!process.env.EMAIL_SERVER;
  console.log(
    "[auth] Email config: RESEND_API_KEY=" + (hasResend ? "set" : "missing") + ", EMAIL_SERVER=" + (hasSmtp ? "set" : "missing")
  );
}

export async function GET(req: NextRequest) {
  logAuthEnv();
  const { handlers } = await import("@/lib/auth");
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  logAuthEnv();
  const { handlers } = await import("@/lib/auth");
  return handlers.POST(req);
}
