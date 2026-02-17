import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/lib/prisma";
import { sendVerificationRequest } from "@/lib/email";
import { getEmailEnv } from "@/lib/email-env";
import type { VerificationRequestParams } from "@/lib/email";

// Read at runtime so Next.js doesn't inline env at build time.
function isEmailConfigured(): boolean {
  return !!(process.env["EMAIL_SERVER"] || process.env["RESEND_API_KEY"]);
}

function defaultSendVerificationRequest(params: VerificationRequestParams) {
  return sendVerificationRequest(params, getEmailEnv());
}

let authInstance: ReturnType<typeof NextAuth> | null = null;

function createAuthInstance(sendVerificationRequest: (params: VerificationRequestParams) => Promise<void>): ReturnType<typeof NextAuth> {
  return NextAuth({
    adapter: PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]),
    session: { strategy: "database", maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
    pages: { signIn: "/login" },
    providers: [
      ...(isEmailConfigured()
        ? [
            Nodemailer({
              server: process.env["EMAIL_SERVER"] ?? { host: "localhost", port: 1, secure: false },
              from: process.env["EMAIL_FROM"] ?? "noreply@example.com",
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
  if (!authInstance) authInstance = createAuthInstance(defaultSendVerificationRequest);
  return authInstance;
}

/** Call from the auth API route with a sender that reads process.env in the route chunk. */
export function getHandlers(sendVerificationRequest: (params: VerificationRequestParams) => Promise<void>) {
  authInstance = createAuthInstance(sendVerificationRequest);
  return authInstance.handlers;
}

export const handlers = { GET: (req: Request) => getInstance().handlers.GET(req), POST: (req: Request) => getInstance().handlers.POST(req) };
export const auth = () => getInstance().auth();
export const signIn = (...args: Parameters<ReturnType<typeof NextAuth>["signIn"]>) => getInstance().signIn(...args);
export const signOut = (...args: Parameters<ReturnType<typeof NextAuth>["signOut"]>) => getInstance().signOut(...args);

/**
 * Get the current session on the server (Auth.js v5).
 */
export async function getServerAuthSession() {
  return auth();
}
