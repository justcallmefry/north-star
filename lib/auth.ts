import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/lib/prisma";
import { sendVerificationRequest } from "@/lib/email";
import { getEmailEnv } from "@/lib/email-env";

// Read at runtime so Next.js doesn't inline env at build time (Vercel build may not have RESEND_API_KEY).
function isEmailConfigured(): boolean {
  return !!(process.env["EMAIL_SERVER"] || process.env["RESEND_API_KEY"]);
}

// Use getEmailEnv() so we use env set by the route (same request); avoids email chunk's process.env being inlined empty.
function makeSendVerificationRequest() {
  return (params: Parameters<typeof sendVerificationRequest>[0]) =>
    sendVerificationRequest(params, getEmailEnv());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]),
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    ...(isEmailConfigured()
      ? [
          Nodemailer({
            server: process.env["EMAIL_SERVER"] ?? { host: "localhost", port: 1, secure: false },
            from: process.env["EMAIL_FROM"] ?? "noreply@example.com",
            sendVerificationRequest: makeSendVerificationRequest(),
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

/**
 * Get the current session on the server (Auth.js v5).
 * Use in Server Components, Route Handlers, and Server Actions.
 */
export async function getServerAuthSession() {
  return auth();
}
