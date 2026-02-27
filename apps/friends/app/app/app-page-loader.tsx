"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TODAY_IMAGE_PATHS, pickDistinctSeeded } from "@/lib/today-images";
import { AppPageClient } from "./app-page-client";
import type { AppPageInitialData, Relationship } from "./app-page-client";

/**
 * Loads app data from the API (session + relationships). The browser sends the
 * session cookie on this request, so we avoid the server-not-seeing-cookie
 * issue that breaks login redirects when using getServerAuthSession() in RSC.
 */
export function AppPageLoader() {
  const router = useRouter();
  const [data, setData] = useState<AppPageInitialData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [debugMessage, setDebugMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/app/me", { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          let debug: string | undefined;
          try {
            const body = await res.json();
            debug = body?.debug ?? body?.message;
          } catch {
            // ignore
          }
          setStatus("error");
          setDebugMessage(debug);
          const loginUrl = new URL("/login", window.location.origin);
          loginUrl.searchParams.set("callbackUrl", "/app");
          if (debug) loginUrl.searchParams.set("debug", debug);
          router.replace(loginUrl.pathname + loginUrl.search);
          return;
        }
        if (!res.ok) {
          setStatus("error");
          return;
        }
        return res.json();
      })
      .then((json) => {
        if (cancelled || !json) return;
        const relationships: Relationship[] = (json.relationships ?? []).map(
          (r: { id: string; name: string | null; status: string }) => ({
            id: r.id,
            name: r.name ?? null,
            status: r.status ?? "active",
          })
        );
        const dateSeed = new Date().toISOString().slice(0, 10);
        const todayImagePaths = pickDistinctSeeded(TODAY_IMAGE_PATHS, 4, dateSeed);
        setData({
          session: { user: json.session?.user ?? {} },
          relationships,
          todayImagePaths,
        });
        setStatus("ok");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === "error" && !data) {
    return (
      <main className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8">
        <p className="text-slate-500 text-sm">Something went wrong. Try again.</p>
        {debugMessage && (
          <p className="font-mono text-xs text-brand-700 bg-brand-50 border border-brand-200 rounded px-3 py-2 max-w-md">
            Debug: {debugMessage}
          </p>
        )}
      </main>
    );
  }

  if (status === "loading" || !data) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center p-8">
        <p className="text-slate-500 text-sm">Loading…</p>
      </main>
    );
  }

  return <AppPageClient initialData={data} />;
}
