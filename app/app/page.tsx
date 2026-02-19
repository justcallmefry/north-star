import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarRange, History, Users } from "lucide-react";
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
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 ring-1 ring-pink-200 shadow-md shadow-pink-100/80">
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
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-500 sm:text-sm">
                North Star
              </p>
              <p className="text-base font-medium text-slate-900 sm:text-lg">
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
          <div className="flex-1 space-y-6">
            {/* Today + quick actions */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                    Today&apos;s connection
                  </h1>
                  <p className="mt-1 text-sm text-slate-600 sm:text-base">
                    Take a minute to respond. Your answer stays private until you both reveal.
                  </p>
                </div>
                <Link
                  href="/app/history"
                  className="hidden items-center gap-1.5 rounded-lg border border-pink-100 bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm hover:border-pink-200 hover:bg-pink-50 sm:inline-flex"
                >
                  <History className="h-3.5 w-3.5" />
                  History
                </Link>
              </div>

              <TodayCard today={today} />

              <Link
                href="/app/meeting"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-pink-500 px-4 py-3 text-base font-semibold text-white shadow-sm shadow-pink-300/60 transition hover:bg-pink-400"
              >
                <CalendarRange className="h-4 w-4" />
                Weekly meeting
              </Link>
            </section>
          </div>
        ) : (
          <section className="mt-4 flex flex-1 items-center justify-center">
            <div className="max-w-md rounded-2xl border border-pink-100 bg-white px-5 py-6 text-center shadow-md shadow-pink-100/80 sm:px-7 sm:py-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500 sm:text-sm">
                Welcome to North Star
              </p>
              <p className="mt-3 text-xl font-semibold text-slate-900 sm:text-2xl">
                Start your shared ritual
              </p>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                Create or join a relationship to get your first daily question. You can invite your
                partner any time.
              </p>
              <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 rounded-lg bg-pink-500 px-5 py-3 text-base font-semibold text-white shadow-sm shadow-pink-300/60 transition hover:bg-pink-400"
                >
                  <ArrowRight className="h-4 w-4" />
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
