import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { isBuildTime } from "@/lib/build";
import { getHistory } from "@/lib/sessions";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

type Props = { searchParams: Promise<{ cursor?: string }> };

const fallback = (
  <main className="min-h-screen p-8">
    <p className="text-gray-500">Loading…</p>
  </main>
);

const HEART_FALLBACKS = ["💗", "💜"] as const;

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
    return (
      <main className="min-h-screen bg-white p-6 sm:p-8">
        <div className="mb-4">
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-pink-300/60 hover:bg-pink-400"
          >
            Answer your daily question
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Our history</h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Prompts you&apos;ve answered together, newest first.
        </p>
        <ul className="mt-6 space-y-4">
          {items.length === 0 ? (
            <li className="text-sm text-slate-500">No revealed sessions yet.</li>
          ) : (
            items.map((item) => (
              <li
                key={item.sessionId}
                className="rounded-2xl border border-pink-100 bg-white p-4 shadow-md shadow-pink-100/80 sm:p-5"
              >
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 sm:text-sm">
                  {format(new Date(item.sessionDate), "PPP")}
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 sm:text-lg">
                  {item.promptText}
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {item.responses.map((r, index) => {
                    const isMe = r.userId === currentUserId;
                    const title = isMe
                      ? "My response"
                      : r.userName
                        ? `${r.userName.trim()}${r.userName.trim().endsWith("s") ? "'" : "'s"} response`
                        : "Their response";
                    const icon =
                      (r.userImage as string) || (isMe ? HEART_FALLBACKS[0] : HEART_FALLBACKS[1]);
                    const bubbleClass = isMe
                      ? "border-pink-200 bg-pink-50"
                      : "border-violet-100 bg-violet-50";

                    return (
                      <div key={r.userId} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-base">
                            {icon}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-900 ${bubbleClass}`}
                          >
                            {title}
                          </span>
                        </div>
                        <p className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm leading-relaxed text-slate-900 sm:text-base">
                          {r.content ?? "—"}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {item.reflections.some((r) => r.reaction) && (
                  <p className="mt-3 text-xs text-slate-500 sm:text-sm">
                    Reactions:{" "}
                    {item.reflections.map((r) => r.reaction).filter(Boolean).join(", ")}
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
              className="text-sm font-medium text-pink-600 underline"
            >
              Load more
            </Link>
          </p>
        )}
      </main>
    );
  } catch (err: unknown) {
    // During Vercel/Next build there is no session; redirect() would throw and fail "collect page data"
    if (isBuildTime()) return fallback;
    if (err && typeof err === "object" && "digest" in err && String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw err;
    return fallback;
  }
}
