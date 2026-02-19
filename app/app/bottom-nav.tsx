"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarRange, History, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/app", label: "Today", icon: Home },
  { href: "/app/history", label: "Responses", icon: History },
  { href: "/app/meeting", label: "Weekly", icon: CalendarRange },
  { href: "/app/meeting/history", label: "Meetings", icon: History },
  { href: "/app/us", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  // Hide nav on larger screens where the left rail is visible
  // and on non-app routes (just in case)
  if (!pathname.startsWith("/app")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-pink-100 bg-white/95 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
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
              className={`flex flex-1 flex-col items-center gap-0.5 text-[11px] font-medium ${
                isActive ? "text-pink-600" : "text-slate-400"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs ${
                  isActive ? "border-pink-200 bg-pink-50" : "border-slate-100 bg-white"
                }`}
              >
                <Icon className={isActive ? "h-4 w-4" : "h-4 w-4 text-slate-400"} />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

