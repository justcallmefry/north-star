import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { getCoupleInsights } from "@/lib/insights";
import { InsightsShareButton } from "./insights-share-button";
import { CountUp } from "@/components/count-up";

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
        <>
          {/* Progress hero */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 via-white to-dusk-50 border border-brand-100 p-6 animate-calm-fade-in animate-calm-delay-1 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                  Your portrait is forming
                </p>
                <p className="mt-1 font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
                  {insights.sessionsCompleted} of {insights.sessionsRequired} check-ins
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {insights.sessionsRequired - insights.sessionsCompleted === 1
                    ? "One more and your couple type is revealed."
                    : insights.sessionsRequired - insights.sessionsCompleted <= 3
                    ? `Only ${insights.sessionsRequired - insights.sessionsCompleted} more — you're almost there.`
                    : "Each check-in sharpens the picture."}
                </p>
              </div>
              {/* Progress ring */}
              <div className="shrink-0" aria-hidden>
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="30" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                  <circle
                    cx="36" cy="36" r="30"
                    fill="none"
                    stroke="#1f4e73"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.round((insights.sessionsCompleted / insights.sessionsRequired) * 188)} 188`}
                    transform="rotate(-90 36 36)"
                  />
                  <text x="36" y="41" textAnchor="middle" className="font-bold" fontSize="16" fontWeight="700" fill="#1f4e73">
                    {Math.round((insights.sessionsCompleted / insights.sessionsRequired) * 100)}%
                  </text>
                </svg>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-2 w-full rounded-full bg-brand-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-700"
                style={{ width: `${Math.round((insights.sessionsCompleted / insights.sessionsRequired) * 100)}%` }}
              />
            </div>
            <Link
              href="/app/agreement"
              className="ns-btn-primary mt-5 inline-flex w-full items-center justify-center gap-2 py-3 transition active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" />
              Do today&apos;s alignment check-in
            </Link>
          </section>

          {/* Locked preview cards — tease what's coming */}
          <div className="space-y-3 animate-calm-fade-in animate-calm-delay-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 px-1">
              Coming soon for you two
            </p>
            {/* Couple type teaser */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 p-6 sm:p-7 select-none">
              <div className="blur-[3px] opacity-60">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">You two are</p>
                <p className="mt-1 font-display text-3xl font-semibold text-white">The ·····</p>
                <p className="mt-2 text-base text-white/90">Your tagline goes here.</p>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/20 pt-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Alignment</p>
                    <p className="mt-0.5 text-2xl font-bold text-white">··%</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Mind-reading</p>
                    <p className="mt-0.5 text-2xl font-bold text-white">··%</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow">
                  <Sparkles className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-white drop-shadow">Unlocks at {insights.sessionsRequired} check-ins</p>
              </div>
            </div>

            {/* Where you land closest — locked */}
            <div className="relative rounded-2xl border border-slate-200 bg-white p-4 overflow-hidden select-none">
              <div className="blur-sm opacity-40 pointer-events-none space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Where you land closest</p>
                </div>
                {["················", "···············", "··················"].map((s, i) => (
                  <div key={i} className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-3 text-base text-transparent">{s}</div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs font-semibold text-slate-400">Your top agreements — coming soon</p>
              </div>
            </div>
          </div>
        </>
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
                  <CountUp
                    to={Math.round(insights.alignmentPct)}
                    suffix="%"
                    storageKey={`insights-alignment:${insights.sessionsCompleted}`}
                  />
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Mind-reading
                </p>
                <p className="mt-0.5 text-2xl font-bold sm:text-3xl">
                  <CountUp
                    to={Math.round(insights.mindReadingPct)}
                    suffix="%"
                    storageKey={`insights-mindreading:${insights.sessionsCompleted}`}
                  />
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
