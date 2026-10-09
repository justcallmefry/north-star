"use client";

import { useEffect } from "react";
import { ErrorCard } from "@/components/error-card";

/**
 * Errors thrown anywhere under the root layout. Replaces Next's default
 * error screen, which inside the iOS app looked like the app had broken.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error.digest ?? "", error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-cream-50 px-6 text-[#2b2620]">
      <ErrorCard onRetry={reset} />
    </main>
  );
}
