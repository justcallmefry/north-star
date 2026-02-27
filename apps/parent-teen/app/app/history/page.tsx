import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { isBuildTime } from "@/lib/build";
import { getHistory } from "@/lib/sessions";
import { HistoryListWithSearch } from "./history-list-with-search";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

type Props = { searchParams: Promise<{ cursor?: string }> };

const fallback = (
  <main className="min-h-screen p-8">
    <p className="text-gray-500">Loading…</p>
  </main>
);

export default async function HistoryPage({ searchParams }: Props) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) redirect("/login");

    const relationships = await getMyActiveRelationships();
    const relationshipId = relationships[0]?.id ?? null;
    if (!relationshipId) redirect("/app");

    const { cursor } = await searchParams;
    const { items, nextCursor } = await getHistory(relationshipId, cursor, PAGE_SIZE);
    const currentUserId = session.user.id;

    const itemsForClient = items.map((item) => ({
      ...item,
      sessionDate:
        typeof item.sessionDate === "string"
          ? item.sessionDate
          : (item.sessionDate as Date).toISOString(),
    }));

    return (
      <main className="min-h-screen bg-white p-6 sm:p-8">
        <div className="mb-5">
          <Link href="/app" className="ns-btn-primary !py-2 text-sm">
            Answer today&apos;s question
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Our history</h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Questions you&apos;ve answered together.
        </p>
        <div className="mt-6">
          <HistoryListWithSearch
            items={itemsForClient}
            nextCursor={nextCursor}
            currentUserId={currentUserId}
            sessionUserName={session.user.name ?? null}
          />
        </div>
      </main>
    );
  } catch (err: unknown) {
    if (isBuildTime()) return fallback;
    if (err && typeof err === "object" && "digest" in err && String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw err;
    return fallback;
  }
}
