"use client";

import { useEffect } from "react";
import { ErrorCard } from "@/components/error-card";

/**
 * Errors inside the signed-in app. Living at this level keeps the app shell
 * and bottom navigation on screen, so a failure in one view never strands
 * someone outside the app.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error boundary]", error.digest ?? "", error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-6 py-16 text-[#2b2620]">
      <ErrorCard onRetry={reset} />
    </div>
  );
}
