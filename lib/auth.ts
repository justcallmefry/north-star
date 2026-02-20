import type { NextRequest } from "next/server";
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
  return NextAuth({
    adapter: PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]),
    session: { strategy: "database", maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
    pages: { signIn: "/login" },
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
      authorized({ auth: session, request: { nextUrl } }) {
        const isLoggedIn = !!session?.user;
        if (nextUrl.pathname.startsWith("/app")) return isLoggedIn;
        return true;
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

/**
 * Get the current session on the server (Auth.js v5).
 */
export async function getServerAuthSession() {
  return auth();
}
