import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/lib/prisma";
import { sendVerificationRequest } from "@/lib/email";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]),
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    // Only add Nodemailer when configured (e.g. at runtime). Skip during build so "Collecting page data" doesn't throw.
    ...(process.env.EMAIL_SERVER
      ? [
          Nodemailer({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM ?? "noreply@example.com",
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

/**
 * Get the current session on the server (Auth.js v5).
 * Use in Server Components, Route Handlers, and Server Actions.
 */
export async function getServerAuthSession() {
  return auth();
}
