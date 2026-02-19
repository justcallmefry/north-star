import { Sparkles } from "lucide-react";
import { BottomNav } from "./bottom-nav";

export const dynamic = "force-dynamic";

export default function AppSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl gap-6 overflow-x-hidden px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        {/* Left rail / app frame (desktop/tablet) — star icon only, no wordmark */}
        <aside className="hidden w-64 flex-col justify-between rounded-2xl border border-pink-100 bg-pink-50 p-5 shadow-lg shadow-pink-100/80 md:flex">
          <div className="space-y-6">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 ring-1 ring-pink-200/80">
                <Sparkles className="h-5 w-5 text-pink-500" strokeWidth={1.7} />
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
        <main className="ns-card relative flex-1 border-slate-200 px-4 py-5 shadow-lg sm:px-6 md:py-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
