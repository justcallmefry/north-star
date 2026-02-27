"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** If still unauthenticated after this long, redirect anyway (in case status never went through "loading"). */
const FALLBACK_REDIRECT_MS = 3500;

/**
 * Rendered when the server had no session (e.g. first request after login redirect).
 * - If client gets session → full page nav so next request has cookie.
 * - Redirect to login only after we've seen "loading" then "unauthenticated", or after fallback delay.
 */
export function AppGate({ callbackUrl }: { callbackUrl?: string } = {}) {
  const { status } = useSession();
  const router = useRouter();
  const navigated = useRef(false);
  const sawLoading = useRef(false);

  if (status === "loading") sawLoading.current = true;

  useEffect(() => {
    if (status === "authenticated" && !navigated.current) {
      navigated.current = true;
      window.location.href = callbackUrl ?? "/app";
      return;
    }
    if (status !== "unauthenticated") return;

    const loginUrl = callbackUrl
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/login";

    if (sawLoading.current) {
      router.replace(loginUrl);
      return;
    }

    const t = setTimeout(() => router.replace(loginUrl), FALLBACK_REDIRECT_MS);
    return () => clearTimeout(t);
  }, [status, router, callbackUrl]);

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <p className="text-slate-500 text-sm">Loading…</p>
    </main>
  );
}
