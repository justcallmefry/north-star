import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getHandlers, handlers } from "@/lib/auth";
import { sendMagicLinkWithKey } from "@/lib/email";
import { setEmailEnv } from "@/lib/email-env";

export const dynamic = "force-dynamic";

const getRequestOrigin = (req: NextRequest) => {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : "";
};

const DEV_SECRET = "aligned-dev-secret-do-not-use-in-production";

/** Ensure redirects use the URL you're actually on. On localhost we use the request host so port 3000 vs 3003 doesn't matter. On Vercel we use VERCEL_URL when env is a placeholder. Returns { origin, secret } for passing into getHandlers so the auth instance always has valid config. */
function ensureAuthUrl(req: NextRequest): { origin: string; secret: string } {
  const requestOrigin = getRequestOrigin(req);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";

  // Localhost: always use the port the user is actually visiting so callbacks stay on the same port
  if (host && (host.startsWith("localhost") || host.startsWith("127.0.0.1"))) {
    const origin = requestOrigin || `http://${host}`;
    process.env.AUTH_URL = origin;
    process.env.NEXTAUTH_URL = origin;
    process.env.AUTH_TRUST_HOST = "true";
    const secret =
      process.env.AUTH_SECRET ?? (process.env.NODE_ENV === "development" ? DEV_SECRET : "");
    if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "development") {
      process.env.AUTH_SECRET = secret;
    }
    return { origin, secret: secret || DEV_SECRET };
  }

  // Production: if the request is on a different host than NEXTAUTH_URL (e.g. user moved to new domain), use request origin so magic links and redirects stay on the site they're visiting
  let authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  if (requestOrigin && authUrl) {
    try {
      const requestHost = new URL(requestOrigin).host;
      const authHost = new URL(authUrl).host;
      if (requestHost !== authHost) {
        process.env.AUTH_URL = requestOrigin;
        process.env.NEXTAUTH_URL = requestOrigin;
        authUrl = requestOrigin;
      }
    } catch {
      // ignore
    }
  }

  const vercelUrl = process.env.VERCEL_URL;
  const isPlaceholder =
    !authUrl || authUrl.includes("your-main-url") || authUrl.includes("your-app.vercel");
  if (vercelUrl && isPlaceholder) {
    const url = `https://${vercelUrl}`;
    process.env.AUTH_URL = url;
    process.env.NEXTAUTH_URL = url;
    authUrl = url;
  }

  let origin = authUrl || requestOrigin;
  let secret = process.env.AUTH_SECRET ?? "";
  // Dev fallback: avoid Configuration error when env is missing (e.g. no .env.local)
  if (process.env.NODE_ENV === "development") {
    if (!origin || origin === "") origin = "http://localhost:3000";
    if (!secret) secret = DEV_SECRET;
  }
  return { origin, secret };
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

/** Build handler options for this request so the auth instance has valid config. */
function getRouteHandlerOptions(routeAuth: { origin: string; secret: string }) {
  const { emailConfigured, from } = getEmailConfig();
  return {
    emailConfigured,
    from,
    secret: routeAuth.secret || undefined,
    authUrl: routeAuth.origin || undefined,
  };
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

/** Rewrite redirect to stay on the request's host (avoids sending user to old domain e.g. north-star when they're on alignedconnectingcouples.com). */
function safeRedirectLocation(req: NextRequest, location: string): string {
  const requestOrigin = getRequestOrigin(req);
  if (!requestOrigin || !location.startsWith("http")) return location;
  try {
    const locUrl = new URL(location);
    const reqUrl = new URL(requestOrigin);
    if (locUrl.host !== reqUrl.host) {
      return `${requestOrigin}${locUrl.pathname}${locUrl.search}`;
    }
  } catch {
    // ignore
  }
  return location;
}

/** Forward Auth response and ensure all Set-Cookie headers are sent (Next.js can drop multiples otherwise). */
function forwardAuthResponse(req: NextRequest, res: Response): NextResponse {
  const status = res.status;
  const rawLocation = res.headers.get("location");
  const location = rawLocation ? safeRedirectLocation(req, rawLocation) : null;
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
  const routeAuth = ensureAuthUrl(req);
  const opts = getRouteHandlerOptions(routeAuth);
  const requestHandlers = getHandlers(sendVerificationRequestFromRoute, opts);
  if (process.env.NODE_ENV === "development") {
    console.log("[auth route] GET origin=%s secretSet=%s", routeAuth.origin, !!routeAuth.secret);
  }
  const res = await requestHandlers.GET(req);
  return forwardAuthResponse(req, res);
}

export async function POST(req: NextRequest) {
  const routeAuth = ensureAuthUrl(req);
  const opts = getRouteHandlerOptions(routeAuth);
  const requestHandlers = getHandlers(sendVerificationRequestFromRoute, opts);
  if (process.env.NODE_ENV === "development") {
    console.log("[auth route] POST origin=%s secretSet=%s", routeAuth.origin, !!routeAuth.secret);
  }
  const res = await requestHandlers.POST(req);
  if (process.env.NODE_ENV === "development") {
    const location = res.headers.get("location") ?? "";
    if (location.includes("error=Configuration")) {
      console.error("[auth route] Auth.js returned Configuration error. Check [auth] error lines above for the real cause.");
    }
  }
  return forwardAuthResponse(req, res);
}
