import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarRange, History, Sparkles } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { isBuildTime } from "@/lib/build";
import { getToday } from "@/lib/sessions";
import { EmptyTogetherIllustration } from "@/components/illustrations";
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
      <main className="flex h-full flex-col ns-stack">
        {/* Header — star icon only (no wordmark), tagline as calm emotional anchor */}
        <header className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50/80 ring-1 ring-pink-200/80" aria-hidden>
              <Sparkles className="h-5 w-5 text-pink-500" strokeWidth={1.7} />
            </div>
            <p className="text-base text-slate-600 sm:text-lg">
              One question a day. Answer together.
            </p>
          </div>
          <div className="hidden flex-col items-end text-xs text-slate-400 sm:flex">
            <span className="text-slate-500">Signed in as</span>
            <span className="mt-0.5 max-w-[180px] truncate text-sm font-medium text-slate-600">
              {displayName}
            </span>
          </div>
        </header>

        {relationships.length > 0 ? (
          <div className="ns-stack flex-1 animate-fade-in-ease">
            {/* Today + quick actions */}
            <section className="ns-stack-tight">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                    Today
                  </h1>
                  <p className="mt-1 text-sm text-slate-600 sm:text-base">
                    Answer honestly. You can edit until you both reveal.
                  </p>
                </div>
                <Link
                  href="/app/history"
                  className="ns-btn-secondary hidden sm:inline-flex"
                >
                  <History className="h-3.5 w-3.5" />
                  History
                </Link>
              </div>

              <TodayCard today={today} />

              <div className="space-y-1.5">
                <Link
                  href="/app/meeting"
                  className="ns-btn-secondary w-full !py-2"
                >
                  <CalendarRange className="h-4 w-4" />
                  Our Week
                </Link>
                <p className="text-center text-sm text-slate-500 leading-relaxed">
                  A shared place to capture this week as it unfolds.
                </p>
              </div>
            </section>
          </div>
        ) : (
          <section className="mt-4 flex flex-1 items-center justify-center">
            <div className="ns-card max-w-md text-center">
              <div className="flex justify-center">
                <EmptyTogetherIllustration className="w-28 h-28 sm:w-32 sm:h-32" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500 sm:text-sm">
                Welcome
              </p>
              <p className="mt-3 text-xl font-semibold text-slate-900 sm:text-2xl">
                Create or join
              </p>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                Create or join to get your first question. Invite your partner when you&apos;re ready.
              </p>
              <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/onboarding"
                  className="ns-btn-primary"
                >
                  <ArrowRight className="h-4 w-4" />
                  Create or join
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
