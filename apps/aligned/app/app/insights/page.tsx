import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { getCoupleInsights } from "@/lib/insights";
import { InsightsShareButton } from "./insights-share-button";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const primary = relationships[0] ?? null;
  if (!primary) redirect("/app/pair");

  const insights = await getCoupleInsights(primary.id);

  return (
    <main className="ns-stack">
      <header className="space-y-2 animate-calm-fade-in">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 ring-1 ring-brand-200">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-brand-500">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Couple Insights
          </span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
          The shape of you two
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Built from your alignment check-ins. Updates as you keep showing up.
        </p>
      </header>

      {!insights.ready ? (
        <section className="ns-card animate-calm-fade-in animate-calm-delay-1 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <Sparkles className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <p className="mt-4 text-lg font-semibold text-slate-900 sm:text-xl">
            Still learning about you two
          </p>
          <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
            Your couple type unlocks after{" "}
            <span className="font-semibold text-slate-900">
              {insights.sessionsRequired} alignment check-ins
            </span>
            . You&apos;ve done {insights.sessionsCompleted} so far.
          </p>
          <Link
            href="/app/agreement"
            className="ns-btn-primary mt-5 inline-flex w-full items-center justify-center gap-2 py-3 sm:w-auto sm:px-6"
          >
            Do today&apos;s alignment
          </Link>
        </section>
      ) : (
        <>
          <section
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${insights.coupleType.gradient} p-6 text-white shadow-lg animate-calm-fade-in animate-calm-delay-1 sm:p-7`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
              You two are
            </p>
            <p className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
              {insights.coupleType.name}
            </p>
            <p className="mt-2 text-base text-white/90 sm:text-lg">
              {insights.coupleType.tagline}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/20 pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Alignment
                </p>
                <p className="mt-0.5 text-2xl font-bold sm:text-3xl">
                  {Math.round(insights.alignmentPct)}%
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Mind-reading
                </p>
                <p className="mt-0.5 text-2xl font-bold sm:text-3xl">
                  {Math.round(insights.mindReadingPct)}%
                </p>
              </div>
            </div>
          </section>

          <section className="ns-card animate-calm-fade-in animate-calm-delay-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
              What this means
            </h2>
            <p className="mt-2 text-base leading-relaxed text-slate-700 sm:text-lg">
              {insights.coupleType.description}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Based on {insights.statementsScored} statement-pairs across{" "}
              {insights.sessionsCompleted} check-ins.
            </p>
          </section>

          {insights.topAligned.length > 0 && (
            <section className="ns-card animate-calm-fade-in animate-calm-delay-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden />
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
                  Where you land closest
                </h2>
              </div>
              <ul className="mt-3 space-y-3">
                {insights.topAligned.map((s, i) => (
                  <li
                    key={`${s.text}-${i}`}
                    className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-3 text-base text-slate-800 sm:text-lg"
                  >
                    {s.text}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {insights.topDivergent.length > 0 && insights.topDivergent[0].distance >= 2 && (
            <section className="ns-card animate-calm-fade-in animate-calm-delay-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-amber-600" aria-hidden />
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
                  Where you see things differently
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Worth a conversation, not a verdict.
              </p>
              <ul className="mt-3 space-y-3">
                {insights.topDivergent
                  .filter((s) => s.distance >= 2)
                  .map((s, i) => (
                    <li
                      key={`${s.text}-${i}`}
                      className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-3 text-base text-slate-800 sm:text-lg"
                    >
                      {s.text}
                    </li>
                  ))}
              </ul>
            </section>
          )}

          <div className="animate-calm-fade-in animate-calm-delay-2">
            <InsightsShareButton
              typeName={insights.coupleType.name}
              tagline={insights.coupleType.tagline}
              alignmentPct={insights.alignmentPct}
              mindReadingPct={insights.mindReadingPct}
            />
          </div>
        </>
      )}
    </main>
  );
}
