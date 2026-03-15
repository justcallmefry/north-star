"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, CalendarRange, History, User, HelpCircle, Scale } from "lucide-react";
import { BottomNav } from "./bottom-nav";

const SIDEBAR_NAV = [
  { href: "/app", label: "Today", icon: Home },
  { href: "/app/quiz", label: "Quiz", icon: HelpCircle },
  { href: "/app/agreement", label: "Alignment", icon: Scale },
  { href: "/app/history", label: "Responses", icon: History },
  { href: "/app/meeting", label: "Our Week", icon: CalendarRange },
  { href: "/app/us", label: "Profile", icon: User },
] as const;

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isQuizActive = pathname.startsWith("/app/quiz") && searchParams.get("done") !== "1";

  return (
    <>
      <div
        id="app-scroll"
        className={`flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pt-4 md:min-h-0 md:pt-6 ${
          isQuizActive ? "pb-6" : "pb-36 md:pb-6"
        }`}
        style={{
          overscrollBehaviorX: "none",
          overscrollBehaviorY: "auto",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
        } as React.CSSProperties}
      >
        <div className="mx-auto flex w-full min-w-0 max-w-6xl gap-6 px-4 pb-16 sm:px-6 lg:px-8 md:pb-6">
          {!isQuizActive && (
            <aside className="hidden w-64 flex-shrink-0 flex-col justify-between rounded-2xl border border-amber-200/50 bg-[#f5f2ee] p-5 shadow-lg md:flex">
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
                    One question a day
                  </p>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Answer privately. Reveal when you&apos;re both ready.
                  </p>
                </div>
                <div className="h-px w-full border-t border-brand-200/50" />
                <nav className="space-y-1" aria-label="App navigation">
                  {SIDEBAR_NAV.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-white/80 hover:text-slate-900"
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="mt-6 space-y-2 text-sm text-slate-500">
                <p>Calm, private, no feed.</p>
                <p className="text-xs leading-snug">
                  Your answers are only shared with your partner after you both answer.
                </p>
              </div>
            </aside>
          )}
          <main
            className={`ns-card relative min-w-0 flex-1 border-slate-200/90 px-4 py-5 shadow-lg sm:px-6 md:py-6 ${
              isQuizActive ? "max-w-2xl md:mx-auto md:w-full" : ""
            }`}
          >
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
