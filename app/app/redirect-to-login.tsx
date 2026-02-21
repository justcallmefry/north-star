"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Client-only redirect to login. Used so the app page never sends a server redirect (302);
 * that way a refetch or RSC revalidation always gets 200 and can’t send the user to login.
 */
export function RedirectToLogin({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }, [router, callbackUrl]);
  return (
    <main className="flex min-h-[40vh] items-center justify-center p-8">
      <p className="text-slate-500 text-sm">Redirecting to sign in…</p>
    </main>
  );
}
