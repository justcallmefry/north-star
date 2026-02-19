import Link from "next/link";
import { redirect } from "next/navigation";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { CalendarRange, Sparkles } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { isBuildTime } from "@/lib/build";
import { getCurrentMeeting, getMeeting } from "@/lib/meetings";
import { MeetingForm } from "./meeting-form";
import { MeetingView } from "./meeting-view";
import { NotifyPartnerMeetingButton } from "../notify-partner-meeting-button";

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

    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
    const weekLabel = `${format(weekStart, "MMMM d")}–${format(weekEnd, "d, yyyy")}`;
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1 ring-1 ring-pink-200">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-pink-500">
              <CalendarRange className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-600">
              Weekly Meeting
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Weekly Meeting</h1>
          <p className="flex items-start gap-2 text-base text-slate-700 sm:text-lg">
            <span className="mt-0.5 text-pink-500">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>
              A short weekly check‑in to talk about what&apos;s working, what&apos;s hard, and what you
              each need. Add highlights, lowlights, and little moments as the week unfolds.
            </span>
          </p>
          <p className="text-sm text-slate-500 sm:text-base">Week of {weekLabel}</p>
        </header>

        <div className="space-y-5">
          {!current.hasUserSubmitted && (
            <section className="rounded-2xl border border-pink-100 bg-white p-4 sm:p-5 shadow-md shadow-pink-100/80">
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Fill out this week</h2>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                You each fill this out on your own. Come back during the week to jot down highs,
                lows, and the moments and events you shared—date nights, time with friends or
                family, anything you want to remember. When you meet, you&apos;ll have both entries
                side-by-side.
              </p>
              <div className="mt-4">
                <MeetingForm meetingId={current.meetingId} />
              </div>
            </section>
          )}

          {current.hasUserSubmitted && !current.canViewPartner && (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:text-base">
              <p>
                Your entry is saved. Your partner&apos;s entry will appear once they submit. You can
                nudge them to fill in their side.
              </p>
              <NotifyPartnerMeetingButton meetingId={current.meetingId} size="sm" />
            </div>
          )}

          {current.hasUserSubmitted && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">View meeting</h2>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
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
            <section className="rounded-2xl border border-pink-100 bg-white p-4 sm:p-5 shadow-md shadow-pink-100/80">
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Update your entry</h2>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                Drop in high points, low points, and events anytime during or after the week if
                something changed or you didn&apos;t get a chance to write earlier.
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
              className="text-sm font-medium text-pink-600 underline hover:text-pink-500"
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
