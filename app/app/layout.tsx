import Image from "next/image";
import { BottomNav } from "./bottom-nav";

export const dynamic = "force-dynamic";

export default function AppSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen h-[100dvh] w-full max-w-[100vw] flex-col overflow-hidden md:min-h-screen" style={{ backgroundColor: "#18181B", overscrollBehaviorX: "none" }}>
      {/* Only this area scrolls so fixed bottom nav stays viewport-locked on mobile */}
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pb-24 md:min-h-0 md:pb-6" style={{ overscrollBehaviorX: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 gap-6 px-4 pt-6 pb-6 sm:px-6 lg:px-8 md:pb-6 md:pt-6">
          {/* Left rail / app frame (desktop/tablet) — star icon only, no wordmark */}
          <aside className="hidden w-64 flex-shrink-0 flex-col justify-between rounded-2xl border border-white/10 p-5 shadow-lg md:flex" style={{ backgroundColor: "#18181B" }}>
            <div className="space-y-6">
              <div>
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                  <Image
                    src="/north-star-app-logo.png"
                    alt=""
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <p className="mt-3 text-xl font-semibold text-white">
                  One question a day
                </p>
                <p className="mt-1.5 text-sm text-pink-200/90">
                  Answer privately. Reveal when you&apos;re both ready.
                </p>
              </div>
              <div className="h-px w-full border-t border-white/10" />
              <div className="space-y-3 text-base text-pink-200/90">
                <p className="font-medium text-white">Today</p>
                <p className="text-pink-200/80">
                  Answer honestly. You can edit until you both reveal.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-2 text-sm text-pink-200/70">
              <p>Calm, private, no feed.</p>
            </div>
          </aside>

          {/* Main app surface */}
          <main className="ns-card relative min-w-0 flex-1 border-slate-200 px-4 py-5 shadow-lg sm:px-6 md:py-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation — fixed to viewport; only the content area above scrolls */}
      <BottomNav />
    </div>
  );
}
