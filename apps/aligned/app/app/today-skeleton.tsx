// apps/aligned/app/app/today-skeleton.tsx
export function TodaySkeleton() {
  return (
    <section className="relative rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm sm:p-6 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-6 w-44 rounded-lg bg-slate-100" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-3 w-16 rounded bg-slate-100" />
        <div className="h-3 w-14 rounded bg-slate-100" />
        <div className="h-3 w-12 rounded bg-slate-100" />
      </div>
      <div className="mt-5 space-y-3">
        <div className="h-6 w-11/12 rounded bg-slate-100" />
        <div className="h-6 w-9/12 rounded bg-slate-100" />
      </div>
      <div className="mt-6 h-12 w-full rounded-xl bg-slate-100" />
    </section>
  );
}
