import Link from "next/link";
import { redirect } from "next/navigation";
import { format, addDays } from "date-fns";
import { CalendarRange } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { getCurrentRelationshipId } from "@/lib/current-relationship";
import { isBuildTime } from "@/lib/build";
import { getMeetingHistory, getCurrentMeeting } from "@/lib/meetings";

export const dynamic = "force-dynamic";

const fallback = <main className="min-h-screen p-8"><p className="text-gray-500">Loading…</p></main>;

/** Parse "2026-W08" (ISO week) and return "Week of February 16–22, 2026". */
function formatWeekLabel(weekKey: string): string {
  const match = weekKey.match(/^(\d{4})-W(\d{1,2})$/);
  if (!match) return weekKey;
  const year = parseInt(match[1], 10);
  const weekNum = parseInt(match[2], 10);
  // Jan 4 is always in ISO week 1 of its year; find its Monday
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay(); // 0 Sun .. 6 Sat
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - daysToMonday);
  const weekStart = addDays(week1Monday, (weekNum - 1) * 7);
  const weekEnd = addDays(weekStart, 6);
  return `Week of ${format(weekStart, "MMMM d")}–${format(weekEnd, "d, yyyy")}`;
}

export default async function MeetingHistoryPage() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) redirect("/login");

    const relationshipId = await getCurrentRelationshipId();
    if (!relationshipId) redirect("/app");

    const items = await getMeetingHistory(relationshipId);
    const current = await getCurrentMeeting(relationshipId);

    return (
    <main className="min-h-screen bg-white p-6 sm:p-8">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 ring-1 ring-brand-200">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-brand-500">
            <CalendarRange className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Past Weeks
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Past Weeks</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">Past weeks, latest first.</p>
      </header>

      <ul className="mt-6 ns-stack-tight">
        {items.length === 0 ? (
          <li>
            <Link
              href="/app/meeting"
              className="ns-card block transition hover:border-brand-200"
            >
              <p className="font-medium text-slate-900">
                {current ? formatWeekLabel(current.weekKey) : "This week"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Go to Our Week to add your notes.
              </p>
            </Link>
          </li>
        ) : (
          items.map((item) => (
            <li key={item.meetingId}>
              <Link
                href={`/app/meeting/${item.meetingId}`}
                className="ns-card block transition hover:border-brand-200"
              >
                <p className="font-medium text-slate-900">
                  {formatWeekLabel(item.weekKey)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.hasUserSubmitted ? "You added notes" : "No notes yet"} ·{" "}
                  {item.canViewPartner ? "You both added notes" : "Partner hasn't added yet"}
                </p>
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
