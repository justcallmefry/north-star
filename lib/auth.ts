import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/lib/prisma";
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
  /** Sender address for magic-link emails when using Resend without EMAIL_FROM (e.g. "onboarding@resend.dev"). Set from the route so it works on Vercel. */
  defaultFrom?: string;
};

function createAuthInstance(
  sendVerificationRequest: (params: VerificationRequestParams) => Promise<void>,
  options?: AuthHandlerOptions
): ReturnType<typeof NextAuth> {
  const emailConfigured =
    options?.emailConfigured ?? !!(process.env["EMAIL_SERVER"] || process.env["RESEND_API_KEY"]);
  const from =
    process.env["EMAIL_FROM"] ?? options?.defaultFrom ?? "noreply@example.com";
  return NextAuth({
    adapter: PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]),
    session: { strategy: "database", maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
    pages: { signIn: "/login" },
    providers: [
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
