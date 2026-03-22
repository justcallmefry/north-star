"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, CalendarRange, History, User, HelpCircle, Scale } from "lucide-react";

const NAV_ITEMS: Array<{ href: string; label: string; icon: typeof Home; hidden?: boolean }> = [
  { href: "/app", label: "Today", icon: Home },
  { href: "/app/quiz", label: "Quiz", icon: HelpCircle },
  { href: "/app/agreement", label: "Alignment", icon: Scale },
  { href: "/app/history", label: "Responses", icon: History },
  { href: "/app/meeting", label: "Our Week", icon: CalendarRange, hidden: true },
  { href: "/app/us", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFocusMode =
    (pathname.startsWith("/app/quiz") || pathname.startsWith("/app/agreement")) &&
    searchParams.get("done") !== "1";

  if (!pathname.startsWith("/app")) return null;
  if (isFocusMode) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-amber-200/90 bg-gradient-to-b from-[#faf6f0] to-[#f0e8dc] shadow-[0_-8px_24px_-4px_rgba(43,140,190,0.12)] md:hidden"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
        position: "fixed",
        left: 0,
        right: 0,
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-2 py-2.5">
        {NAV_ITEMS.filter((item) => !item.hidden).map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/app"
              ? pathname === "/app" || pathname.startsWith("/app?")
              : href === "/app/meeting"
                ? pathname === "/app/meeting" || pathname.startsWith("/app/meeting?")
                : pathname === href ||
                  pathname.startsWith(href + "?") ||
                  pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1 transition-all active:scale-[0.98] ${
                isActive ? "bg-white/90 shadow-md ring-2 ring-[#2b8cbe]/35" : ""
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                  isActive
                    ? "bg-[#2b8cbe] text-white shadow-sm"
                    : "bg-white/80 text-slate-500 shadow-sm ring-1 ring-amber-200/60"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span
                className={`w-full truncate text-center text-[10px] font-bold leading-tight ${
                  isActive ? "text-[#1e6b9e]" : "text-slate-600"
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
