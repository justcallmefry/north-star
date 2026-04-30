"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarRange, History, User, HelpCircle, Scale } from "lucide-react";

const NAV_ITEMS: Array<{ href: string; label: string; icon: typeof Home; hidden?: boolean }> = [
  { href: "/app", label: "Today", icon: Home },
  { href: "/app/quiz", label: "Quiz", icon: HelpCircle },
  { href: "/app/agreement", label: "Alignment", icon: Scale },
  { href: "/app/history", label: "Responses", icon: History },
  { href: "/app/meeting", label: "Our Week", icon: CalendarRange },
  { href: "/app/us", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  if (!pathname.startsWith("/app")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/70 bg-white/90 backdrop-blur-md md:hidden"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
        position: "fixed",
        left: 0,
        right: 0,
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-2 py-2">
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
              className={`relative flex flex-1 flex-col items-center gap-0.5 min-w-0 px-1 py-1.5 rounded-xl transition-colors active:opacity-80 ${
                isActive ? "bg-dusk-50" : ""
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                  isActive ? "bg-dusk-500 text-white" : "text-slate-500"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span
                className={`text-[10px] font-semibold leading-tight text-center truncate w-full ${
                  isActive ? "text-dusk-700" : "text-slate-500"
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
