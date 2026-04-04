import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { isBuildTime } from "@/lib/build";
import { getHistory } from "@/lib/sessions";
import { HistoryListWithSearch } from "./history-list-with-search";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

type Props = { searchParams: Promise<{ page?: string }> };

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

    const { page: pageParam } = await searchParams;
    const page = Math.max(1, parseInt(String(pageParam), 10) || 1);
    const { items, page: currentPage, totalPages, hasPrev, hasNext } = await getHistory(relationshipId, page, PAGE_SIZE);
    const currentUserId = session.user.id;

    const itemsForClient = items.map((item) => ({
      ...item,
      sessionDate:
        typeof item.sessionDate === "string"
          ? item.sessionDate
          : (item.sessionDate as Date).toISOString(),
      responses: item.responses.map((r) => ({ ...r, noResponse: r.noResponse ?? false })),
    }));

    return (
      <main className="flex flex-col gap-4">
        <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Section">
          <Link
            href="/app/together"
            className="font-medium text-brand-600 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-200 rounded"
          >
            ← Together
          </Link>
          <Link
            href="/app"
            className="font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 rounded"
          >
            Today
          </Link>
        </nav>
        <header>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Our history</h1>
          <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
            Moments you&apos;ve already shared—questions and reveals in one place.
          </p>
        </header>
        <div className="mt-4">
          <HistoryListWithSearch
            items={itemsForClient}
            page={currentPage}
            totalPages={totalPages}
            hasPrev={hasPrev}
            hasNext={hasNext}
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
