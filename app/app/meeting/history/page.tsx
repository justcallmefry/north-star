import Link from "next/link";
import { redirect } from "next/navigation";
import { format, parse, startOfWeek, endOfWeek } from "date-fns";
import { CalendarRange } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { isBuildTime } from "@/lib/build";
import { getMeetingHistory } from "@/lib/meetings";

export const dynamic = "force-dynamic";

const fallback = <main className="min-h-screen p-8"><p className="text-gray-500">Loading…</p></main>;

export default async function MeetingHistoryPage() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) redirect("/login");

    const relationships = await getMyActiveRelationships();
    const relationshipId = relationships[0]?.id ?? null;
    if (!relationshipId) redirect("/app");

    const items = await getMeetingHistory(relationshipId);

    const formatWeekLabel = (weekKey: string) => {
      try {
        // weekKey like "2026-W08" → approximate date in that ISO week
        const base = parse(weekKey, "yyyy-'W'II", new Date());
        const weekStart = startOfWeek(base, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(base, { weekStartsOn: 0 });
        return `Week of ${format(weekStart, "MMMM d")}–${format(weekEnd, "d, yyyy")}`;
      } catch {
        return weekKey;
      }
    };

    return (
    <main className="min-h-screen bg-white p-6 sm:p-8">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1 ring-1 ring-pink-200">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-pink-500">
            <CalendarRange className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-600">
            Meeting History
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Meeting History</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">Past weeks, latest first.</p>
      </header>

      <ul className="mt-6 space-y-3">
        {items.length === 0 ? (
          <li className="text-sm text-slate-500">No past meetings yet.</li>
        ) : (
          items.map((item) => (
            <li key={item.meetingId}>
              <Link
                href={`/app/meeting/${item.meetingId}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
              >
                <span className="font-medium text-slate-900">
                  {formatWeekLabel(item.weekKey)}
                </span>
                <span className="ml-2 text-sm text-slate-500">
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
  } catch (err: unknown) {
    if (isBuildTime()) return fallback;
    if (err && typeof err === "object" && "digest" in err && String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw err;
    return fallback;
  }
}
