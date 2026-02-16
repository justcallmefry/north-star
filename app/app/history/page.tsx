import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { getHistory } from "@/lib/sessions";
import { format } from "date-fns";

const PAGE_SIZE = 10;

type Props = { searchParams: Promise<{ cursor?: string }> };

export default async function HistoryPage({ searchParams }: Props) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const relationshipId = relationships[0]?.id ?? null;
  if (!relationshipId) redirect("/app");

  const { cursor } = await searchParams;
  const { items, nextCursor } = await getHistory(relationshipId, cursor, PAGE_SIZE);

  return (
    <main className="min-h-screen p-8">
      <p className="mb-4">
        <Link href="/app" className="text-sm text-indigo-600 underline dark:text-indigo-400">
          ← Back to app
        </Link>
      </p>
      <h1 className="text-2xl font-bold">History</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Past revealed sessions, newest first.
      </p>
      <ul className="mt-6 space-y-4">
        {items.length === 0 ? (
          <li className="text-gray-500">No revealed sessions yet.</li>
        ) : (
          items.map((item) => (
            <li
              key={item.sessionId}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <p className="text-sm text-gray-500">
                {format(new Date(item.sessionDate), "PPP")}
              </p>
              <p className="mt-1 font-medium">{item.promptText}</p>
              <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {item.responses.map((r, i) => (
                  <li key={i}>{r.content ?? "—"}</li>
                ))}
              </ul>
              {item.reflections.some((r) => r.reaction) && (
                <p className="mt-2 text-xs text-gray-500">
                  Reactions: {item.reflections.map((r) => r.reaction).filter(Boolean).join(", ")}
                </p>
              )}
            </li>
          ))
        )}
      </ul>
      {nextCursor && (
        <p className="mt-6">
          <Link
            href={`/app/history?cursor=${encodeURIComponent(nextCursor)}`}
            className="text-sm text-indigo-600 underline dark:text-indigo-400"
          >
            Load more
          </Link>
        </p>
      )}
    </main>
  );
}
