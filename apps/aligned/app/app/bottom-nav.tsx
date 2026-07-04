"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, User, Sparkles, Bookmark } from "lucide-react";

const NAV_ITEMS: Array<{ href: string; label: string; icon: typeof Home; hidden?: boolean }> = [
  { href: "/app", label: "Today", icon: Home },
  { href: "/app/insights", label: "Us", icon: Sparkles },
  { href: "/app/memories", label: "Memories", icon: Bookmark },
  { href: "/app/meeting", label: "Recap", icon: BookOpen },
  { href: "/app/us", label: "You", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  if (!pathname.startsWith("/app")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/5 md:hidden"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
        position: "fixed",
        left: 0,
        right: 0,
        // Deep dusk — the app's namesake evening. Gives the whole layout a
        // dark anchor so the warm surfaces above read as "designed", not blank.
        background: "linear-gradient(180deg, #143452 0%, #0F2740 100%)",
        boxShadow: "0 -8px 24px -12px rgb(15 39 64 / 0.5)",
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
                isActive ? "bg-white/10" : ""
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                  isActive ? "bg-peach-300 text-dusk-800" : "text-dusk-100/70"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span
                className={`text-[10px] font-semibold leading-tight text-center truncate w-full ${
                  isActive ? "text-white" : "text-dusk-100/60"
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
