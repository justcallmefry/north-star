import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyTogetherIllustration } from "@/components/illustrations";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { isBuildTime } from "@/lib/build";
import { getHistory } from "@/lib/sessions";
import { format } from "date-fns";
import { ResponseBubbleValidation } from "./response-bubble-validation";

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
        <div className="mb-5">
          <Link href="/app" className="ns-btn-primary !py-2 text-sm">
            Answer today&apos;s question
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Our history</h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Questions you&apos;ve answered together.
        </p>
        <ul className="mt-6 ns-stack-tight">
          {items.length === 0 ? (
            <li className="ns-card flex flex-col items-center justify-center py-12 text-center">
              <EmptyTogetherIllustration className="w-32 h-32 sm:w-40 sm:h-40" />
              <p className="mt-4 text-base font-medium text-slate-700 sm:text-lg">No revealed sessions yet.</p>
              <p className="mt-1 text-sm text-slate-500">Answer today&apos;s question and reveal together to see it here.</p>
            </li>
          ) : (
            items.map((item, itemIndex) => (
              <li
                key={item.sessionId}
                className="ns-card animate-calm-fade-in"
                style={{ animationDelay: `${itemIndex * 80}ms` }}
              >
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 sm:text-sm">
                  {format(new Date(item.sessionDate), "PPP")}
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 sm:text-lg">
                  {item.promptText}
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {item.responses.map((r) => {
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
                    const hasPartnerResponse = item.responses.length >= 2;

                    return (
                      <div
                        key={r.id}
                        className={!isMe ? "animate-calm-fade-in animate-calm-delay-1" : ""}
                      >
                        <ResponseBubbleValidation
                          responseId={r.id}
                          content={r.content}
                          title={title}
                          icon={icon}
                          bubbleClass={bubbleClass}
                          validation={r.validation}
                          canValidate={!isMe}
                          hasPartnerResponse={hasPartnerResponse}
                        />
                      </div>
                    );
                  })}
                </div>
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
    if (isBuildTime()) return fallback;
    if (err && typeof err === "object" && "digest" in err && String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw err;
    return fallback;
  }
}
