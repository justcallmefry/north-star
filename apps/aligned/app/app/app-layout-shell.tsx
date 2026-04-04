"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, FolderHeart, User, HelpCircle, Scale } from "lucide-react";
import { BottomNav } from "./bottom-nav";

const SIDEBAR_NAV = [
  { href: "/app", label: "Today", icon: Home },
  { href: "/app/together", label: "Together", icon: FolderHeart },
  { href: "/app/quiz", label: "Guess & compare", icon: HelpCircle },
  { href: "/app/agreement", label: "Same page?", icon: Scale },
  { href: "/app/us", label: "You", icon: User },
] as const;

function isSidebarActive(pathname: string, href: string): boolean {
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
  if (href === "/app/us") return pathname.startsWith("/app/us");
  if (href === "/app/quiz") return pathname.startsWith("/app/quiz");
  if (href === "/app/agreement") return pathname.startsWith("/app/agreement");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathForNav = pathname ?? "";
  /** Match bottom nav: focus chrome only after Start (?playing=1), not on quiz/alignment intro. */
  const isFocusMode =
    (pathname.startsWith("/app/quiz") || pathname.startsWith("/app/agreement")) &&
    searchParams.get("done") !== "1" &&
    searchParams.get("playing") === "1";

  return (
    <>
      <div
        id="app-scroll"
        className={`flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-gradient-to-b from-sky-100/50 via-[#e2ebe4] to-[#d4e2d9] pt-3 md:min-h-0 md:pt-5 ${
          isFocusMode ? "pb-6" : "pb-36 md:pb-6"
        }`}
        style={{
          overscrollBehaviorX: "none",
          overscrollBehaviorY: "auto",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
        } as React.CSSProperties}
      >
        <div className="mx-auto flex w-full min-w-0 max-w-6xl gap-6 px-4 pb-16 sm:px-6 lg:px-8 md:pb-6">
          {!isFocusMode && (
            <aside className="hidden w-64 flex-shrink-0 flex-col justify-between rounded-2xl border border-emerald-800/15 bg-[#e8f2eb] p-5 shadow-lg md:flex">
              <div className="space-y-6">
                <div>
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-brand-200/80 shadow-sm">
                    <Image
                      src="/aligned-icon.png"
                      alt=""
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <p className="mt-3 text-xl font-semibold text-slate-900">
                    One private prompt a day
                  </p>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Replies stay hidden until you&apos;re both in—then you open together.
                  </p>
                </div>
                <div className="h-px w-full border-t border-emerald-800/10" />
                <nav className="space-y-1" aria-label="App navigation">
                  {SIDEBAR_NAV.map(({ href, label, icon: Icon }) => {
                    const active = isSidebarActive(pathForNav, href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                          active
                            ? "bg-white/95 text-slate-900 shadow-sm ring-1 ring-emerald-200/70"
                            : "text-slate-700 hover:bg-white/80 hover:text-slate-900"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                        {label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="mt-6 space-y-2 text-sm text-slate-500">
                <p>No feed. No public scores.</p>
                <p className="text-xs leading-snug">
                  Same rhythm every day: reply separately, open together.
                </p>
              </div>
            </aside>
          )}
          <main
            className={`relative min-w-0 flex-1 overflow-hidden rounded-2xl border-2 border-brand-300/45 bg-[#f6faf7] shadow-lg ring-1 ring-emerald-900/5 ${
              isFocusMode ? "max-w-2xl md:mx-auto md:w-full" : ""
            }`}
          >
            {!isFocusMode && (
              <header className="relative bg-gradient-to-r from-[#4a7a8c] via-[#3d6b7d] to-[#355d6e] px-4 py-3.5 text-white shadow-sm after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#69BE28] after:content-[''] sm:px-6 sm:py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85">
                  Aligned
                </p>
                <p className="mt-1 text-base font-semibold leading-snug text-white sm:text-lg">
                  One private prompt. Open when you&apos;re both ready.
                </p>
                <p className="mt-1 text-xs text-white/80 sm:text-sm">
                  About three minutes—unhurried, for just the two of you.
                </p>
              </header>
            )}
            <div
              className={
                isFocusMode
                  ? "px-4 pb-4 pt-0 sm:px-6 sm:pb-5 md:pb-6"
                  : "px-4 py-4 sm:px-6 md:py-5"
              }
            >
              {children}
            </div>
          </main>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
