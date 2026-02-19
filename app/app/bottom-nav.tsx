"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarRange, History, User, ClipboardList } from "lucide-react";

const NAV_ITEMS = [
  { href: "/app", label: "Today", icon: Home },
  { href: "/app/history", label: "Responses", icon: History },
  { href: "/app/meeting", label: "Our Week", icon: CalendarRange },
  { href: "/app/meeting/history", label: "Past Weeks", icon: ClipboardList },
  { href: "/app/us", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

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
              prefetch={true}
              className={`flex flex-1 flex-col items-center gap-0.5 text-[11px] font-medium transition-opacity active:opacity-70 ${
                isActive ? "text-pink-600" : "text-slate-600"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs transition-colors ${
                  isActive ? "border-pink-200 bg-pink-50" : "border-slate-200 bg-slate-50"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-pink-600" : "text-slate-600"}`} />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
