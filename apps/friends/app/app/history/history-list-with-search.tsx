"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { EmptyTogetherIllustration } from "@/components/illustrations";
import { ResponseBubbleValidation } from "./response-bubble-validation";

const HEART_FALLBACKS = ["💗", "💜"] as const;

/** Serializable shape for history items (sessionDate as string for client). */
export type HistoryItemForClient = {
  sessionId: string;
  sessionDate: string;
  promptText: string;
  responses: {
    id: string;
    userId: string;
    content: string | null;
    userName: string | null;
    userImage: string | null;
    validation: { reactions: string | null; acknowledgment: string | null } | null;
  }[];
  reflections: { userId: string; content: string | null; reaction: string | null }[];
};

type Props = {
  items: HistoryItemForClient[];
  nextCursor: string | null;
  currentUserId: string;
  sessionUserName: string | null;
};

function itemMatchesQuery(item: HistoryItemForClient, q: string): boolean {
  const lower = q.trim().toLowerCase();
  if (!lower) return true;
  if (item.promptText.toLowerCase().includes(lower)) return true;
  for (const r of item.responses) {
    if (r.content?.toLowerCase().includes(lower)) return true;
  }
  for (const ref of item.reflections) {
    if (ref.content?.toLowerCase().includes(lower)) return true;
    if (ref.reaction?.toLowerCase().includes(lower)) return true;
  }
  return false;
}

export function HistoryListWithSearch({
  items,
  nextCursor,
  currentUserId,
  sessionUserName,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return items.filter((item) => itemMatchesQuery(item, query));
  }, [items, query]);

  const hasQuery = query.trim().length > 0;

  return (
    <>
      {items.length > 0 && (
        <div className="mb-4">
          <label htmlFor="history-search" className="sr-only">
            Search responses by word or phrase
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="history-search"
              type="search"
              placeholder="Search by word or phrase…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
            />
          </div>
          {hasQuery && (
            <p className="mt-1.5 text-xs text-slate-500">
              Searching this page. Load more to search older entries.
            </p>
          )}
        </div>
      )}

      <ul className="ns-stack-tight">
        {items.length === 0 ? (
          <li className="ns-card flex flex-col items-center justify-center py-12 text-center">
            <EmptyTogetherIllustration className="w-32 h-32 sm:w-40 sm:h-40" />
            <p className="mt-4 text-base font-medium text-slate-700 sm:text-lg">
              No revealed sessions yet.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Answer today&apos;s question and reveal together to see it here.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Every day you both answer, you&apos;ll add another moment to this history.
            </p>
          </li>
        ) : filtered.length === 0 ? (
          <li className="ns-card py-10 text-center">
            <p className="text-slate-600">No responses match &quot;{query.trim()}&quot;.</p>
            <p className="mt-1 text-sm text-slate-500">Try another word or load more history.</p>
          </li>
        ) : (
          filtered.map((item, itemIndex) => (
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
                  const possessive = (name: string) =>
                    `${name.trim()}${name.trim().endsWith("s") ? "'" : "'s"}`;
                  const title = isMe
                    ? (sessionUserName
                        ? `${possessive(sessionUserName)} response`
                        : "My response")
                    : r.userName
                      ? `${possessive(r.userName)} response`
                      : "Their response";
                  const icon =
                    (r.userImage as string) || (isMe ? HEART_FALLBACKS[0] : HEART_FALLBACKS[1]);
                  const bubbleClass = isMe
                    ? "border-brand-200 bg-brand-50"
                    : "border-green-200 bg-green-50";
                  const titleTextClass = isMe ? "text-brand-800" : "text-green-800";
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
                        titleTextClass={titleTextClass}
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

              {item.reflections.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400 mb-2">
                    Our responses back
                  </p>
                  <div className="space-y-2">
                    {item.reflections.map((ref) => {
                      const text = ref.content || ref.reaction;
                      if (!text) return null;
                      const isMeRef = ref.userId === currentUserId;
                      const refName =
                        item.responses.find((r) => r.userId === ref.userId)?.userName ?? null;
                      const label = refName
                        ? `${refName.trim()}: `
                        : isMeRef
                          ? "You: "
                          : "Them: ";
                      const nameClass = isMeRef ? "font-medium text-brand-700" : "font-medium text-green-700";
                      return (
                        <p key={ref.userId} className="text-sm text-slate-600">
                          <span className={nameClass}>{label}</span>
                          {text}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </li>
          ))
        )}
      </ul>

      {nextCursor && (
        <p className="mt-6">
          <Link
            href={`/app/history?cursor=${encodeURIComponent(nextCursor)}`}
            className="text-sm font-medium text-brand-600 underline"
          >
            Load more
          </Link>
        </p>
      )}

      {items.length > 0 && (
        <p className="mt-6">
          <button
            type="button"
            onClick={() => document.getElementById("app-scroll")?.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-sm font-medium text-brand-600 underline hover:text-brand-700 focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 rounded"
          >
            Back to top
          </button>
        </p>
      )}
    </>
  );
}
