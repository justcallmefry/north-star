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
      <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Our Week</h1>
      <p className="mt-1 text-sm text-slate-600 sm:text-base">
        A shared place to capture this week as it unfolds. Week of {data.weekKey}
      </p>

      <div className="mt-6">
        <MeetingView
          ownEntry={data.ownEntry}
          partnerEntry={data.partnerEntry}
          canViewPartner={data.canViewPartner}
        />
      </div>

      <section className="ns-card ns-stack-tight mt-8">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Add to Our Week</h2>
        <p className="text-sm text-slate-600 sm:text-base">
          Optional prompts. Add or edit anytime.
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
