"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, FolderHeart, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/app", label: "Today", icon: Home },
  { href: "/app/together", label: "Together", icon: FolderHeart },
  { href: "/app/us", label: "You", icon: User },
] as const;

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/app") {
    if (pathname === "/app" || pathname.startsWith("/app?")) return true;
    if (pathname.startsWith("/app/quiz")) return true;
    if (pathname.startsWith("/app/agreement")) return true;
    if (pathname.startsWith("/app/session/")) return true;
    return false;
  }
  if (href === "/app/together") {
    return (
      pathname.startsWith("/app/together") ||
      pathname.startsWith("/app/history") ||
      pathname.startsWith("/app/meeting")
    );
  }
  if (href === "/app/us") {
    return pathname.startsWith("/app/us");
  }
  return false;
}

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  /** Hide nav only while actively in quiz/alignment flow (?playing=1), not on the start gate. */
  const hideForPlayingFlow =
    (pathname.startsWith("/app/quiz") || pathname.startsWith("/app/agreement")) &&
    searchParams.get("done") !== "1" &&
    searchParams.get("playing") === "1";

  if (!pathname.startsWith("/app")) return null;
  if (hideForPlayingFlow) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-800/15 bg-[#f0f7f2]/95 backdrop-blur-md shadow-[0_-8px_24px_-8px_rgba(22,83,42,0.1)] md:hidden"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
        position: "fixed",
        left: 0,
        right: 0,
      }}
      aria-label="Primary"
    >
      <div className="mx-auto flex w-full max-w-md items-stretch justify-around gap-1 px-3 py-2.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = isNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={`relative flex min-w-0 flex-1 max-w-[7.5rem] flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-all active:scale-[0.98] ${
                isActive ? "bg-white/95 shadow-sm ring-1 ring-emerald-800/12" : ""
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                  isActive
                    ? "bg-[#69BE28] text-white shadow-sm ring-1 ring-emerald-900/15"
                    : "bg-white/80 text-slate-500 shadow-sm ring-1 ring-slate-200/80"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span
                className={`w-full truncate text-center text-[11px] font-semibold leading-tight ${
                  isActive ? "text-emerald-950" : "text-slate-600"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
