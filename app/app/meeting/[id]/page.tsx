import { notFound } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { getMeeting } from "@/lib/meetings";
import { MeetingView } from "../meeting-view";
import { MeetingForm } from "../meeting-form";
import { NotifyPartnerMeetingButton } from "../../notify-partner-meeting-button";

type Props = { params: Promise<{ id: string }> };

export default async function MeetingByIdPage({ params }: Props) {
  const session = await getServerAuthSession();
  if (!session?.user) notFound();

  const { id } = await params;
  const data = await getMeeting(id);
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-white p-6 sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Weekly meeting</h1>
      <p className="mt-1 text-sm text-slate-600 sm:text-base">Week of {data.weekKey}</p>

      <div className="mt-6">
        <MeetingView
          ownEntry={data.ownEntry}
          partnerEntry={data.partnerEntry}
          canViewPartner={data.canViewPartner}
        />
      </div>

      <section className="mt-8 space-y-4 rounded-2xl border border-pink-100 bg-white p-5 shadow-md shadow-pink-100/80">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Edit your entry</h2>
        <p className="text-sm text-slate-700 sm:text-base">
          Add or tweak your notes for this week—even after it&apos;s over—so your history stays
          honest and complete.
        </p>
        <div className="mt-4">
          <MeetingForm meetingId={data.meetingId} initial={data.ownEntry} />
        </div>
        <div className="pt-2">
          <NotifyPartnerMeetingButton meetingId={data.meetingId} size="sm" />
        </div>
      </section>
    </main>
  );
}
