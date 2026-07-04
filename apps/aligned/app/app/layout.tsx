import Image from "next/image";
import Link from "next/link";
import { Home, CalendarRange, User, Sparkles, Bookmark } from "lucide-react";
import { BottomNav } from "./bottom-nav";
import { ScrollToTopOnNav } from "./scroll-to-top-on-nav";
import { RouteTransition } from "./route-transition";

export const dynamic = "force-dynamic";

const SIDEBAR_NAV = [
  { href: "/app", label: "Today", icon: Home },
  { href: "/app/insights", label: "Us", icon: Sparkles },
  { href: "/app/memories", label: "Memories", icon: Bookmark },
  { href: "/app/meeting", label: "Week", icon: CalendarRange },
  { href: "/app/us", label: "You", icon: User },
] as const;

export default function AppSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex h-screen h-[100dvh] w-full max-w-[100vw] flex-col overflow-hidden md:min-h-screen"
      style={{
        /* Cream with a faint warm glow from the top corner — atmosphere, not flat paint. */
        background:
          "radial-gradient(1100px 700px at 88% -12%, #F6EBDB 0%, rgba(246,235,219,0) 55%), radial-gradient(900px 600px at -10% 108%, #F0EDE2 0%, rgba(240,237,226,0) 50%), #FAF6F0",
        overscrollBehaviorX: "none",
      }}
    >
      <ScrollToTopOnNav />
      {/* Only this area scrolls so fixed bottom nav stays viewport-locked on mobile */}
      <div
        id="app-scroll"
        className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pb-36 pt-4 md:min-h-0 md:pb-6 md:pt-6"
        style={
          {
            overscrollBehaviorX: "none",
            overscrollBehaviorY: "auto",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
          } as React.CSSProperties
        }
      >
        <div className="mx-auto flex w-full min-w-0 max-w-6xl gap-6 px-4 pt-4 pb-16 sm:px-6 lg:px-8 md:pb-6 md:pt-6">
          {/* Left rail (desktop/tablet): branding + nav links + trust */}
          <aside className="hidden w-64 flex-shrink-0 flex-col justify-between rounded-2xl border border-brand-200/50 p-5 shadow-lg md:flex" style={{ background: "linear-gradient(180deg, #E9F1F1 0%, #F1EFE4 100%)" }}>
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

          {/* Main app surface */}
          <main className="ns-card relative min-w-0 flex-1 px-4 py-5 shadow-lg sm:px-6 md:py-6">
            <RouteTransition>{children}</RouteTransition>
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation — fixed to viewport; only the content area above scrolls */}
      <BottomNav />
    </div>
  );
}
