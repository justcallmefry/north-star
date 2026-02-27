"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Intermediate redirect page. After sign-in, Auth redirects here so the session
 * cookie is sent on this request; we then redirect to the real target so /app
 * receives the cookie and doesn't send the user back to login.
 */
export default function GoPage() {
  const searchParams = useSearchParams();
  const to = searchParams.get("to") ?? "/app";

  useEffect(() => {
    const target = to.startsWith("http") ? to : `${window.location.origin}${to.startsWith("/") ? "" : "/"}${to}`;
    window.location.href = target;
  }, [to]);

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <p className="text-slate-500 text-sm">Taking you there…</p>
    </main>
  );
}
