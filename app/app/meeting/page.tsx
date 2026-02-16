import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { getCurrentMeeting, getMeeting } from "@/lib/meetings";
import { MeetingForm } from "./meeting-form";
import { MeetingView } from "./meeting-view";

export const dynamic = "force-dynamic";

export default async function MeetingPage() {
  const headersList = await headers();
  if (!headersList.get("cookie")) {
    return <main className="min-h-screen p-8"><p className="text-gray-500">Loading…</p></main>;
  }
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const relationshipId = relationships[0]?.id ?? null;
  if (!relationshipId) redirect("/app");

  const current = await getCurrentMeeting(relationshipId);
  if (!current) redirect("/app");

  const meetingData = await getMeeting(current.meetingId);

  return (
    <main className="min-h-screen p-8">
      <p className="mb-4">
        <Link href="/app" className="text-sm text-indigo-600 underline dark:text-indigo-400">
          Back to app
        </Link>
      </p>
      <h1 className="text-2xl font-bold">Weekly Meeting</h1>
      <p className="mt-1 text-gray-600 dark:text-gray-400">Week of {current.weekKey}</p>

      <div className="mt-6 space-y-6">
        {!current.hasUserSubmitted && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold">Fill out this week</h2>
            <p className="mt-1 text-sm text-gray-500">
              Both partners submit independently. You can view your own entry anytime.
            </p>
            <div className="mt-4">
              <MeetingForm meetingId={current.meetingId} />
            </div>
          </section>
        )}

        {current.hasUserSubmitted && !current.canViewPartner && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
            Your entry is saved. Both sides will show when your partner submits.
          </p>
        )}

        {current.hasUserSubmitted && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold">View meeting</h2>
            <div className="mt-4">
              <MeetingView
                ownEntry={meetingData?.ownEntry ?? null}
                partnerEntry={meetingData?.partnerEntry ?? null}
                canViewPartner={current.canViewPartner}
              />
            </div>
            <p className="mt-4">
              <Link
                href={`/app/meeting/${current.meetingId}`}
                className="text-sm text-indigo-600 underline dark:text-indigo-400"
              >
                Open full view
              </Link>
            </p>
          </section>
        )}

        {current.hasUserSubmitted && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold">Update your entry</h2>
            <MeetingForm
              meetingId={current.meetingId}
              initial={meetingData?.ownEntry ?? null}
            />
          </section>
        )}

        <p>
          <Link
            href="/app/meeting/history"
            className="text-sm text-indigo-600 underline dark:text-indigo-400"
          >
            Past weeks
          </Link>
        </p>
      </div>
    </main>
  );
}
