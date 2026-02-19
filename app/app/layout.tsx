import { BottomNav } from "./bottom-nav";

export const dynamic = "force-dynamic";

export default function AppSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl gap-6 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        {/* Left rail / app frame (desktop/tablet) */}
        <aside className="hidden w-64 flex-col justify-between rounded-2xl border border-pink-100 bg-pink-50 p-5 shadow-lg shadow-pink-100/80 md:flex">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-pink-500">
                North Star
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                Daily connection ritual
              </p>
              <p className="mt-2 text-sm text-slate-600">
                One prompt a day. Answer privately, reveal together.
              </p>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-pink-200 via-pink-100 to-pink-200" />
            <div className="space-y-3 text-base text-slate-700">
              <p className="font-medium text-slate-900">Today&apos;s focus</p>
              <p className="text-slate-600">
                Take a minute to reflect before you answer. Your response stays private
                until you&apos;re both ready to reveal.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-2 text-sm text-slate-500">
            <p>Built for couples who want a calm, intentional check-in—not another feed.</p>
          </div>
        </aside>

        {/* Main app surface */}
        <main className="relative flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-lg shadow-pink-100/80 sm:px-6 md:py-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
