import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { isBuildTime } from "@/lib/build";
import { getCurrentMeeting, getMeeting } from "@/lib/meetings";
import { MeetingForm } from "./meeting-form";
import { MeetingView } from "./meeting-view";

export const dynamic = "force-dynamic";

const fallback = <main className="min-h-screen p-8"><p className="text-gray-500">Loading…</p></main>;

export default async function MeetingPage() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) redirect("/login");

    const relationships = await getMyActiveRelationships();
    const relationshipId = relationships[0]?.id ?? null;
    if (!relationshipId) redirect("/app");

    const current = await getCurrentMeeting(relationshipId);
    if (!current) redirect("/app");

    const meetingData = await getMeeting(current.meetingId);
    return (
      <div className="space-y-6">
        <p>
          <Link href="/app" className="text-sm font-medium text-sky-300 hover:text-sky-200">
            ← Back to today
          </Link>
        </p>
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Weekly meeting</h1>
          <p className="text-base text-slate-100 sm:text-lg">
            A short weekly check-in to talk about what&apos;s working, what&apos;s hard, and what you
            each need.
          </p>
          <p className="text-sm text-slate-300 sm:text-base">Week of {current.weekKey}</p>
        </header>

        <div className="space-y-5">
          {!current.hasUserSubmitted && (
            <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-slate-50 sm:text-xl">Fill out this week</h2>
              <p className="mt-2 text-sm text-slate-100 sm:text-base">
                You each fill this out on your own. When you meet, you&apos;ll have both entries
                side-by-side.
              </p>
              <div className="mt-4">
                <MeetingForm meetingId={current.meetingId} />
              </div>
            </section>
          )}

          {current.hasUserSubmitted && !current.canViewPartner && (
            <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 sm:text-base">
              Your entry is saved. Your partner&apos;s entry will appear once they submit.
            </p>
          )}

          {current.hasUserSubmitted && (
            <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-slate-50 sm:text-xl">View meeting</h2>
              <p className="mt-2 text-sm text-slate-100 sm:text-base">
                When both of you have submitted, you&apos;ll see your answers side-by-side.
              </p>
              <div className="mt-4">
                <MeetingView
                  ownEntry={meetingData?.ownEntry ?? null}
                  partnerEntry={meetingData?.partnerEntry ?? null}
                  canViewPartner={current.canViewPartner}
                />
              </div>
              <p className="mt-4 text-sm">
                <Link
                  href={`/app/meeting/${current.meetingId}`}
                  className="text-sky-300 underline hover:text-sky-200"
                >
                  Open full view
                </Link>
              </p>
            </section>
          )}

          {current.hasUserSubmitted && (
            <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-slate-50 sm:text-xl">Update your entry</h2>
              <p className="mt-2 text-sm text-slate-100 sm:text-base">
                Make a quick tweak before or after you meet if something changed.
              </p>
              <div className="mt-3">
                <MeetingForm
                  meetingId={current.meetingId}
                  initial={meetingData?.ownEntry ?? null}
                />
              </div>
            </section>
          )}

          <p>
            <Link
              href="/app/meeting/history"
              className="text-sm font-medium text-slate-300 underline hover:text-slate-100"
            >
              Past weeks
            </Link>
          </p>
        </div>
      </div>
    );
  } catch (err: unknown) {
    if (isBuildTime()) return fallback;
    if (err && typeof err === "object" && "digest" in err && String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw err;
    return fallback;
  }
}
