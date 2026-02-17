import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarRange, History, Sparkles, Users } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { isBuildTime } from "@/lib/build";
import { getToday } from "@/lib/sessions";
import { RelationshipActions } from "./relationship-actions";
import { TodayCard } from "./today-card";

export const dynamic = "force-dynamic";

const fallback = <main className="min-h-screen p-8"><p className="text-gray-500">Loading…</p></main>;

export default async function AppPage() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) redirect("/login");

    const relationships = await getMyActiveRelationships();
    const relationshipId = relationships[0]?.id ?? null;
    const today = relationshipId ? await getToday(relationshipId) : null;
    const displayName = session.user.name ?? session.user.email;

    return (
      <main className="flex h-full flex-col gap-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900/80 ring-1 ring-slate-700/80 shadow-[0_14px_40px_rgba(15,23,42,0.9)]">
              <Image
                src="/north-star-logo.png"
                alt="North Star"
                width={32}
                height={32}
                className="h-7 w-7 object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                North Star
              </p>
              <p className="text-sm font-medium text-slate-50">
                One question a day. Answer together.
              </p>
            </div>
          </div>
          <div className="hidden flex-col items-end text-xs text-slate-400 sm:flex">
            <span className="text-slate-500">Signed in as</span>
            <span className="mt-0.5 max-w-[180px] truncate text-sm font-medium text-slate-100">
              {displayName}
            </span>
          </div>
        </header>

        {relationships.length > 0 ? (
          <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
            {/* Left: Today + quick actions */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-semibold text-slate-50 sm:text-xl">
                    Today&apos;s connection
                  </h1>
                  <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                    Take a minute to respond. Your answer stays private until you both reveal.
                  </p>
                </div>
                <Link
                  href="/app/history"
                  className="hidden items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-200 shadow-sm hover:border-slate-500 hover:bg-slate-900 sm:inline-flex"
                >
                  <History className="h-3.5 w-3.5" />
                  History
                </Link>
              </div>

              <TodayCard today={today} />

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/app/meeting"
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-sky-500/30 transition hover:bg-sky-400"
                >
                  <CalendarRange className="h-4 w-4" />
                  Weekly meeting
                </Link>
                <Link
                  href="/app/meeting/history"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-950/60 px-4 py-2 text-sm font-medium text-slate-200 shadow-sm hover:border-slate-500 hover:bg-slate-900"
                >
                  <History className="h-4 w-4" />
                  Meeting history
                </Link>
                <Link
                  href="/app/history"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-950/60 px-4 py-2 text-sm font-medium text-slate-200 shadow-sm hover:border-slate-500 hover:bg-slate-900 sm:hidden"
                >
                  <History className="h-4 w-4" />
                  View history
                </Link>
              </div>
            </section>

            {/* Right: Relationship card */}
            <section className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.85)] sm:px-5 sm:py-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Relationship
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-50">
                      {relationships[0].name ?? "Your relationship"}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-lg bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-slate-300">
                    <Users className="h-3.5 w-3.5" />
                    Connected
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Invite your partner, keep your daily ritual going, and come back here whenever
                  you want to adjust things together.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/invite"
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-emerald-950 shadow-sm shadow-emerald-500/30 transition hover:bg-emerald-400"
                  >
                    <ArrowRight className="h-4 w-4 rotate-[-30deg]" />
                    Invite partner
                  </Link>
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-950/70 px-4 py-2 text-xs font-medium text-slate-200 shadow-sm hover:border-slate-500 hover:bg-slate-900"
                  >
                    Manage relationships
                  </Link>
                </div>

                <div className="mt-4 border-t border-slate-800/80 pt-3">
                  <RelationshipActions relationshipId={relationships[0].id} />
                </div>
              </div>
            </section>
          </div>
        ) : (
          <section className="mt-4 flex flex-1 items-center justify-center">
            <div className="max-w-md rounded-2xl border border-slate-800/80 bg-slate-950/80 px-5 py-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.85)] sm:px-7 sm:py-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Welcome to North Star
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-50">
                Start your shared ritual
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Create or join a relationship to get your first daily question. You can invite your
                partner any time.
              </p>
              <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm shadow-sky-500/30 transition hover:bg-sky-400"
                >
                  <Sparkles className="h-4 w-4" />
                  Start or join relationship
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    );
  } catch (err: unknown) {
    if (isBuildTime()) return fallback;
    if (err && typeof err === "object" && "digest" in err && String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw err;
    return fallback;
  }
}
