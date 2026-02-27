"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, CalendarRange, History, User, HelpCircle, Scale } from "lucide-react";

const NAV_ITEMS = [
  { href: "/app", label: "Today", icon: Home },
  { href: "/app/quiz", label: "Quiz", icon: HelpCircle },
  { href: "/app/agreement", label: "Agreement", icon: Scale },
  { href: "/app/history", label: "Responses", icon: History },
  { href: "/app/meeting", label: "Our Week", icon: CalendarRange },
  { href: "/app/us", label: "Profile", icon: User },
] as const;

/** Query param set when quiz/agreement is in "results" or "waiting for partner" so bottom nav shows. */
const DONE_PARAM = "done";

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!pathname.startsWith("/app")) return null;

  // Hide bottom nav only while taking the quiz/agreement (questions). Show it on results or waiting-for-partner.
  if (pathname.startsWith("/app/quiz") || pathname.startsWith("/app/agreement")) {
    if (searchParams.get(DONE_PARAM) !== "1") return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 md:hidden"
      style={{
        backgroundColor: "#2b8cbe",
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-2 py-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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
              className={`relative flex flex-1 flex-col items-center gap-1 min-w-0 px-1 py-1 rounded-lg transition-colors active:opacity-80 ${
                isActive ? "bg-white/25" : ""
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                  isActive ? "bg-white text-[#2b8cbe]" : "bg-white/20 text-white"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span
                className={`text-[10px] font-bold leading-tight text-center truncate w-full ${
                  isActive ? "text-white" : "text-white/90"
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
