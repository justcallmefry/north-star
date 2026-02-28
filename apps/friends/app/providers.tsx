"use client";

import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import type { Session } from "next-auth";

export function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      {children}
      <Toaster position="top-center" richColors closeButton toastOptions={{ duration: 4000 }} />
    </SessionProvider>
  );
}
