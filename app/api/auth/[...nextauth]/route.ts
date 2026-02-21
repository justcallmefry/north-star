import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getHandlers, handlers } from "@/lib/auth";
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
  const from =
    process.env.EMAIL_FROM ?? (resend ? "onboarding@resend.dev" : undefined) ?? "noreply@example.com";
  return { emailConfigured, resend, smtp, from };
}

/** Initialize the shared auth instance with route config (email, etc.) then use the same handlers so session cookie is set and read by the same instance. */
export function initAuthWithRouteConfig() {
  const { emailConfigured, from } = getEmailConfig();
  getHandlers(sendVerificationRequestFromRoute, { emailConfigured, from });
}

/** Collect all Set-Cookie header values (Headers can have multiple). */
function getAllSetCookies(res: Response): string[] {
  const getSetCookie = (res.headers as Headers & { getSetCookie?(): string[] }).getSetCookie;
  if (typeof getSetCookie === "function") {
    const list = getSetCookie.call(res.headers);
    if (list?.length) return list;
  }
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

/** Forward Auth response and ensure all Set-Cookie headers are sent (Next.js can drop multiples otherwise). */
function forwardAuthResponse(res: Response): NextResponse {
  const status = res.status;
  const location = res.headers.get("location");
  const setCookies = getAllSetCookies(res);

  let nextRes: NextResponse;
  if (status >= 300 && status < 400 && location && setCookies.length > 0) {
    // Return 200 + HTML with meta refresh so the browser stores Set-Cookie before navigating.
    // If we return 302, some browsers follow the redirect before persisting the cookie, so GET /app has no session.
    const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${location.replace(/"/g, "&quot;")}"></head><body>Signing you in…</body></html>`;
    nextRes = new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  } else if (status >= 300 && status < 400 && location) {
    nextRes = NextResponse.redirect(location, status);
  } else {
    const headers = new Headers(res.headers);
    headers.delete("set-cookie");
    nextRes = new NextResponse(res.body, { status, statusText: res.statusText, headers });
  }
  for (const c of setCookies) {
    nextRes.headers.append("set-cookie", c);
  }
  return nextRes;
}

export async function GET(req: NextRequest) {
  ensureAuthUrl(req);
  initAuthWithRouteConfig();
  const res = await handlers.GET(req);
  return forwardAuthResponse(res);
}

export async function POST(req: NextRequest) {
  ensureAuthUrl(req);
  initAuthWithRouteConfig();
  const res = await handlers.POST(req);
  return forwardAuthResponse(res);
}
