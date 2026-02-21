import { NextRequest } from "next/server";
import { cookies, headers } from "next/headers";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { sendVerificationRequest } from "@/lib/email";
import { getEmailEnv } from "@/lib/email-env";
import type { VerificationRequestParams } from "@/lib/email";

function defaultSendVerificationRequest(params: VerificationRequestParams) {
  return sendVerificationRequest(params, getEmailEnv());
}

let authInstance: ReturnType<typeof NextAuth> | null = null;

export type AuthHandlerOptions = {
  /** Pass true when RESEND_API_KEY or EMAIL_SERVER is set (e.g. from the API route) so the email provider is registered even if env is inlined at build time. */
  emailConfigured?: boolean;
  /** Sender address for magic-link emails. Set from the route so Vercel env (e.g. EMAIL_FROM) is used at runtime. Falls back to "onboarding@resend.dev" when using Resend and no custom from. */
  from?: string;
}

function createAuthInstance(
  sendVerificationRequest: (params: VerificationRequestParams) => Promise<void>,
  options?: AuthHandlerOptions
): ReturnType<typeof NextAuth> {
  const emailConfigured =
    options?.emailConfigured ?? !!(process.env["EMAIL_SERVER"] || process.env["RESEND_API_KEY"]);
  const from =
    options?.from ?? process.env["EMAIL_FROM"] ?? "noreply@example.com";
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  const isHttp =
    process.env.NODE_ENV === "development" ||
    (typeof authUrl === "string" && authUrl.startsWith("http://"));
  return NextAuth({
    adapter: PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]),
    // Credentials provider only ever writes a JWT to the cookie (Auth.js has no DB session for credentials).
    // So we must use JWT strategy or session lookup fails and login appears broken.
    session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
    pages: { signIn: "/login" },
    trustHost: true,
    useSecureCookies: !isHttp,
    cookies: {
      sessionToken: {
        options: {
          path: "/",
          sameSite: "lax",
        },
      },
    },
    providers: [
      Credentials({
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || typeof credentials.email !== "string") return null;
          if (!credentials?.password || typeof credentials.password !== "string") return null;
          const email = credentials.email.trim().toLowerCase();
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user?.password) return null;
          if (!verifyPassword(credentials.password, user.password)) return null;
          return { id: user.id, email: user.email ?? undefined, name: user.name ?? undefined, image: user.image ?? undefined };
        },
      }),
      ...(emailConfigured
        ? [
            Nodemailer({
              server: process.env["EMAIL_SERVER"] ?? { host: "localhost", port: 1, secure: false },
              from,
              sendVerificationRequest,
            }),
          ]
        : []),
    ],
    callbacks: {
      session({ session, token }) {
        // JWT strategy puts user id in token.sub; app expects session.user.id
        if (session.user) session.user.id = (token.sub as string) ?? session.user.id;
        return session;
      },
      authorized({ auth: session, request: { nextUrl } }) {
        const isLoggedIn = !!session?.user;
        if (nextUrl.pathname.startsWith("/app")) return isLoggedIn;
        return true;
      },
      redirect({ url, baseUrl }) {
        // Respect callbackUrl from the client so sign-in actually sends users to /app (or wherever they came from)
        const parsed = url.startsWith("http") ? new URL(url) : new URL(url, baseUrl);
        const callbackUrl = parsed.searchParams.get("callbackUrl");
        if (callbackUrl) {
          const target = callbackUrl.startsWith("http") ? callbackUrl : new URL(callbackUrl, baseUrl).href;
          if (target.startsWith(baseUrl)) return target;
        }
        if (parsed.origin === new URL(baseUrl).origin && parsed.pathname !== "/login") return parsed.href;
        return `${baseUrl}/app`;
      },
    },
    debug: process.env.NODE_ENV === "development",
    logger: {
      error(message) {
        console.error("[auth] error:", typeof message === "string" ? message : message?.message ?? String(message));
        if (message instanceof Error && message.cause) {
          const c = message.cause as { err?: Error };
          if (c?.err?.stack) console.error("[auth] cause stack:", c.err.stack);
        } else if (message instanceof Error && message.stack) {
          console.error("[auth] stack:", message.stack);
        }
      },
    },
  });
}

function getInstance(): ReturnType<typeof NextAuth> {
  if (!authInstance) authInstance = createAuthInstance(defaultSendVerificationRequest, undefined);
  return authInstance;
}

/** Call from the auth API route with a sender that reads process.env in the route chunk. Pass emailConfigured so the provider is registered on Vercel (avoids build-time env inlining). */
export function getHandlers(
  sendVerificationRequest: (params: VerificationRequestParams) => Promise<void>,
  options?: AuthHandlerOptions
) {
  authInstance = createAuthInstance(sendVerificationRequest, options);
  return authInstance.handlers;
}

export const handlers = {
  GET: (req: NextRequest) => getInstance().handlers.GET(req),
  POST: (req: NextRequest) => getInstance().handlers.POST(req),
};
export const auth = () => getInstance().auth();
export const signIn = (...args: Parameters<ReturnType<typeof NextAuth>["signIn"]>) => getInstance().signIn(...args);
export const signOut = (...args: Parameters<ReturnType<typeof NextAuth>["signOut"]>) => getInstance().signOut(...args);

const baseUrl = () =>
  process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

/** Build request origin from current request headers so session lookup uses the same host as the browser (fixes post-login redirect when AUTH_URL is not set in RSC). */
async function getRequestOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // headers() can throw in some edge/streaming contexts
  }
  return baseUrl();
}

async function getSessionWithCookieHeader(cookieHeader: string, sessionOrigin?: string) {
  const origin = sessionOrigin ?? baseUrl();
  const host = new URL(origin).host;
  // Match auth route: set AUTH_URL and trust host so session resolution works like /api/auth/session.
  const prevAuthUrl = process.env.AUTH_URL;
  const prevNextAuthUrl = process.env.NEXTAUTH_URL;
  const prevTrustHost = process.env.AUTH_TRUST_HOST;
  process.env.AUTH_URL = origin;
  process.env.NEXTAUTH_URL = origin;
  if (host && (host.startsWith("localhost") || host.startsWith("127.0.0.1"))) {
    process.env.AUTH_TRUST_HOST = "true";
  }
  try {
    const req = new NextRequest(new URL(`${origin}/api/auth/session`), {
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        host,
        "x-forwarded-host": host,
        "x-forwarded-proto": origin.startsWith("https") ? "https" : "http",
      },
    });
    const res = await getInstance().handlers.GET(req);
    if (!res.ok) {
      if (process.env.NODE_ENV === "development") {
        const body = await res.text();
        console.warn("[auth] getSessionWithCookieHeader: handler returned", res.status, res.statusText, "body length:", body.length, "preview:", body.slice(0, 120));
      }
      return null;
    }
    const data = await res.json();
    return data as Awaited<ReturnType<typeof auth>> | null;
  } finally {
    if (prevAuthUrl !== undefined) process.env.AUTH_URL = prevAuthUrl;
    else delete process.env.AUTH_URL;
    if (prevNextAuthUrl !== undefined) process.env.NEXTAUTH_URL = prevNextAuthUrl;
    else delete process.env.NEXTAUTH_URL;
    if (prevTrustHost !== undefined) process.env.AUTH_TRUST_HOST = prevTrustHost;
    else delete process.env.AUTH_TRUST_HOST;
  }
}

/**
 * Get session from an incoming Request (e.g. in Route Handlers).
 * Uses the request's Cookie header and URL origin so the session lookup matches the request.
 */
export async function getSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const origin = new URL(request.url).origin;
  return getSessionWithCookieHeader(cookieHeader, origin);
}

/**
 * Get the current session on the server (Auth.js v5).
 * Uses cookies() so the session is read from the same request cookies the RSC has.
 * Builds the session URL from the current request host so redirect-after-login works when AUTH_URL is not set in this invocation.
 */
export async function getServerAuthSession() {
  const origin = await getRequestOrigin();
  // So session resolution uses the same origin as the request (fixes login redirect loop when AUTH_URL was unset or wrong).
  if (!process.env.AUTH_URL) process.env.AUTH_URL = origin;
  if (!process.env.NEXTAUTH_URL) process.env.NEXTAUTH_URL = origin;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  return getSessionWithCookieHeader(cookieHeader, origin);
}
