import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { getMyActiveRelationships } from "@/lib/relationships";
import { getMeetingHistory } from "@/lib/meetings";

export default async function MeetingHistoryPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const relationshipId = relationships[0]?.id ?? null;
  if (!relationshipId) redirect("/app");

  const items = await getMeetingHistory(relationshipId);

  return (
    <main className="min-h-screen p-8">
      <p className="mb-4">
        <Link href="/app/meeting" className="text-sm text-indigo-600 underline dark:text-indigo-400">
          ← Back to weekly meeting
        </Link>
      </p>
      <h1 className="text-2xl font-bold">Meeting history</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">Past weeks, latest first.</p>

      <ul className="mt-6 space-y-3">
        {items.length === 0 ? (
          <li className="text-gray-500">No past meetings yet.</li>
        ) : (
          items.map((item) => (
            <li key={item.meetingId}>
              <Link
                href={`/app/meeting/${item.meetingId}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
              >
                <span className="font-medium">{item.weekKey}</span>
                <span className="ml-2 text-sm text-gray-500">
                  {item.hasUserSubmitted ? "You submitted" : "Not submitted"} ·{" "}
                  {item.canViewPartner ? "Both visible" : "Partner not yet"}
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
