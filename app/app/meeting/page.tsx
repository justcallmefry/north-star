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
      <div className="ns-stack">
        <header className="animate-calm-fade-in space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1 ring-1 ring-pink-200">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-pink-500">
              <CalendarRange className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-600">
              Our Week
            </span>
          </div>
          <p className="flex items-start gap-2 text-sm text-slate-600 sm:text-base">
            <span className="mt-0.5 text-pink-500">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>
              A shared snapshot of the week. Add when you like—highs, lows, or anything you want to remember.
            </span>
          </p>
          <p className="text-sm text-slate-500 sm:text-base">Week of {weekLabel}</p>
        </header>

        <div className="ns-stack-tight animate-calm-fade-in animate-calm-delay-header">
          <section className="ns-card">
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">This week so far</h2>
            <p className="mt-1 text-sm text-slate-600">A read-only snapshot. You can add or edit your notes below.</p>
            <div className="mt-4">
              <MeetingView
                ownEntry={meetingData?.ownEntry ?? null}
                partnerEntry={meetingData?.partnerEntry ?? null}
                canViewPartner={current.canViewPartner}
              />
            </div>
          </section>

          <section className="ns-card">
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Add to Our Week</h2>
            <p className="mt-1 text-sm text-slate-600">Optional prompts. Write a little or a lot—whatever feels right.</p>
            <div className="mt-4">
              <MeetingForm meetingId={current.meetingId} initial={meetingData?.ownEntry ?? null} />
            </div>
            <div className="mt-4 pt-3 border-t border-pink-100">
              <NotifyPartnerMeetingButton meetingId={current.meetingId} size="sm" />
            </div>
          </section>

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
