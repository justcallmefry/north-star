import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarRange, History } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { isBuildTime } from "@/lib/build";

export const dynamic = "force-dynamic";

const fallback = (
  <main className="p-8">
    <p className="text-slate-500">Loading…</p>
  </main>
);

export default async function TogetherPage() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) redirect("/login");

    const relationships = await getMyActiveRelationships();
    const relationshipId = relationships[0]?.id ?? null;
    if (!relationshipId) redirect("/app");

    return (
      <main className="ns-stack animate-calm-fade-in">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 sm:text-sm">
            Together
          </p>
          <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
            Your shared space
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Past answers and a gentle weekly snapshot—only between you two.
          </p>
          <p className="text-xs text-slate-500">
            Short daily extras (Guess &amp; compare, Same page?) stay on <Link href="/app" className="font-medium text-brand-600 hover:text-brand-700">Today</Link>.
          </p>
        </header>

        <div className="ns-stack-tight grid gap-4 sm:grid-cols-2">
          <Link
            href="/app/history"
            className="group ns-card flex flex-col gap-3 border border-emerald-200/70 bg-white/90 p-5 shadow-sm transition-colors hover:border-emerald-300 hover:bg-white"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80">
              <History className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Our history</h2>
              <p className="mt-1 text-sm text-slate-600 leading-snug">
                Moments you&apos;ve already shared—questions and reveals in one place.
              </p>
            </div>
            <span className="text-sm font-medium text-brand-600 group-hover:text-brand-700">
              Open history →
            </span>
          </Link>

          <Link
            href="/app/meeting"
            className="group ns-card flex flex-col gap-3 border border-emerald-200/70 bg-white/90 p-5 shadow-sm transition-colors hover:border-emerald-300 hover:bg-white"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-800 ring-1 ring-brand-200/80">
              <CalendarRange className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Our Week</h2>
              <p className="mt-1 text-sm text-slate-600 leading-snug">
                Optional snapshot—bright spots, one wish, whatever you want to remember.
              </p>
            </div>
            <span className="text-sm font-medium text-brand-600 group-hover:text-brand-700">
              Open Our Week →
            </span>
          </Link>
        </div>
      </main>
    );
  } catch (err: unknown) {
    if (isBuildTime()) return fallback;
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    )
      throw err;
    return fallback;
  }
}
