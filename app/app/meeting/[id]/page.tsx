import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getMeeting } from "@/lib/meetings";
import { MeetingView } from "../meeting-view";
import { MeetingForm } from "../meeting-form";

type Props = { params: Promise<{ id: string }> };

export default async function MeetingByIdPage({ params }: Props) {
  const session = await getServerAuthSession();
  if (!session?.user) notFound();

  const { id } = await params;
  const data = await getMeeting(id);
  if (!data) notFound();

  return (
    <main className="min-h-screen p-8">
      <p className="mb-4">
        <Link href="/app/meeting" className="text-sm text-indigo-600 underline dark:text-indigo-400">
          ← Back to weekly meeting
        </Link>
      </p>
      <h1 className="text-2xl font-bold">Weekly Meeting</h1>
      <p className="mt-1 text-gray-600 dark:text-gray-400">Week of {data.weekKey}</p>

      <div className="mt-6">
        <MeetingView
          ownEntry={data.ownEntry}
          partnerEntry={data.partnerEntry}
          canViewPartner={data.canViewPartner}
        />
      </div>

      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-lg font-semibold">Edit your entry</h2>
        <div className="mt-4">
          <MeetingForm meetingId={data.meetingId} initial={data.ownEntry} />
        </div>
      </section>
    </main>
  );
}
