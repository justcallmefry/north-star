import Image from "next/image";
import { BottomNav } from "./bottom-nav";

export const dynamic = "force-dynamic";

export default function AppSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen min-h-[100dvh] w-full max-w-[100vw] flex-col overflow-x-hidden bg-white text-slate-900 md:min-h-screen">
      {/* Scrollable area only (keeps bottom nav fixed at viewport bottom on mobile) */}
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto md:min-h-screen">
        <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 gap-6 px-4 pt-6 pb-6 sm:px-6 lg:px-8 md:pb-6 md:pt-6">
          {/* Left rail / app frame (desktop/tablet) — star icon only, no wordmark */}
          <aside className="hidden w-64 flex-shrink-0 flex-col justify-between rounded-2xl border border-pink-100 bg-pink-50 p-5 shadow-lg shadow-pink-100/80 md:flex">
          <div className="space-y-6">
            <div>
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 ring-1 ring-pink-200/80">
                <Image
                  src="/north-star-app-logo.png"
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
            <div className="h-px w-full border-t border-pink-200" />
            <div className="space-y-3 text-base text-slate-700">
              <p className="font-medium text-slate-900">Today</p>
              <p className="text-slate-600">
                Answer honestly. You can edit until you both reveal.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-2 text-sm text-slate-500">
            <p>Calm, private, no feed.</p>
          </div>
        </aside>

          {/* Main app surface */}
          <main className="ns-card relative min-w-0 flex-1 border-slate-200 px-4 py-5 shadow-lg sm:px-6 md:py-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation — in flow so it stays at bottom; no content scrolls under it */}
      <BottomNav />
    </div>
  );
}
