"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/**
 * Renders children only when the user is not authenticated.
 * If authenticated, redirects to /app. Uses client-side session so the server
 * never has to call auth/DB for the welcome page — keeps the page reliable on Vercel.
 */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { status, data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.replace("/app");
    }
  }, [status, session?.user, router]);

  // While loading or authenticated, show minimal content to avoid flash; then redirect or show children
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading…</p>
      </main>
    );
  }
  if (status === "authenticated" && session?.user) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-500 text-sm">Taking you to the app…</p>
      </main>
    );
  }

  return <>{children}</>;
}
