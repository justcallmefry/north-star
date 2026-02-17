export const dynamic = "force-dynamic";

export default function AppSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Left rail / app frame */}
        <aside className="hidden w-64 flex-col justify-between rounded-2xl border border-slate-800/70 bg-slate-900/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.75)] md:flex">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                North Star
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-50">
                Daily connection ritual
              </p>
              <p className="mt-2 text-xs text-slate-400">
                One prompt a day. Answer privately, reveal together.
              </p>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-slate-800 via-slate-700/60 to-slate-800" />
            <div className="space-y-3 text-sm text-slate-300">
              <p className="font-medium text-slate-100">Today&apos;s focus</p>
              <p className="text-slate-400">
                Take a minute to reflect before you answer. Your response stays private
                until you&apos;re both ready to reveal.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-2 text-xs text-slate-500">
            <p>Built for couples who want a calm, intentional check-in—not another feed.</p>
          </div>
        </aside>

        {/* Main app surface */}
        <main className="relative flex-1 rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-950 px-4 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.9)] sm:px-6 md:py-6">
          {/* Soft glow accent */}
          <div
            className="pointer-events-none absolute inset-x-4 top-0 -z-10 h-40 rounded-3xl bg-gradient-to-b from-sky-500/25 via-sky-500/5 to-transparent blur-2xl sm:inset-x-6"
            aria-hidden
          />
          {children}
        </main>
      </div>
    </div>
  );
}
