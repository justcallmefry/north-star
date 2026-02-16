"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitResponse, revealSession, submitReflection } from "@/lib/sessions";
import type { GetSessionResult } from "@/lib/sessions";

type Props = { data: GetSessionResult; currentUserId: string };

export function SessionContent({ data, currentUserId }: Props) {
  const router = useRouter();
  const [text, setText] = useState(data.userResponse ?? "");
  const [reaction, setReaction] = useState<string>("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [revealData, setRevealData] = useState<{
    promptText: string;
    responses: { userId: string; content: string | null }[];
    reflections: { userId: string; content: string | null; reaction: string | null }[];
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("submit");
    try {
      await submitResponse(data.sessionId, text);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(null);
    }
  }

  async function handleReveal() {
    setError(null);
    setLoading("reveal");
    try {
      const result = await revealSession(data.sessionId);
      setRevealData(result);
      setRevealed(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reveal");
    } finally {
      setLoading(null);
    }
  }

  async function handleReaction() {
    if (!reaction.trim()) return;
    setError(null);
    setLoading("reaction");
    try {
      await submitReflection(data.sessionId, reaction.trim());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save reaction");
    } finally {
      setLoading(null);
    }
  }

  const isRevealed = revealed || data.state === "revealed";
  const responsesToShow: (string | null)[] = revealData
    ? revealData.responses.map((r) => r.content ?? null)
    : isRevealed
      ? [data.userResponse ?? null, data.partnerResponse ?? null]
      : [];
  const reflectionsToShow = revealData?.reflections ?? data.reflections ?? [];

  const responseCount = (data.hasUserResponded ? 1 : 0) + (data.hasPartnerResponded ? 1 : 0);

  return (
    <div className="space-y-8">
      <p className="text-center text-xl leading-relaxed text-gray-700 dark:text-gray-300">
        {data.promptText}
      </p>

      {!data.hasUserResponded && (
        <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Your answer..."
            rows={5}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 leading-relaxed text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            required
          />
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Your answer stays private until your partner responds.
          </p>
          <div className="flex flex-col items-center gap-3">
            <button
              type="submit"
              disabled={!!loading}
              className="rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {loading === "submit" ? "Saving…" : "Save my answer"}
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {responseCount} of 2 responses for today.
            </p>
          </div>
        </form>
      )}

      {data.hasUserResponded && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {data.canReveal
            ? "2 of 2 responses for today."
            : "You're 1 of 2 responses for today."}
        </p>
      )}

      {data.hasUserResponded && data.state === "open" && !data.canReveal && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          Waiting on your partner to answer. You can reveal once both have responded.
        </p>
      )}

      {data.hasUserResponded && data.state === "open" && data.canReveal && !isRevealed && (
        <div>
          <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Both of you have answered.</p>
          <button
            type="button"
            onClick={handleReveal}
            disabled={!!loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading === "reveal" ? "Revealing…" : "Reveal answers"}
          </button>
        </div>
      )}

      {isRevealed && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <h3 className="font-semibold">Answers</h3>
          <ul className="space-y-2">
            {responsesToShow.map((content, i) => (
              <li key={i} className="rounded-lg bg-white p-3 dark:bg-gray-800">
                {content ?? "—"}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              placeholder="Quick reaction (e.g. 💕)"
              className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="button"
              onClick={handleReaction}
              disabled={!!loading || !reaction.trim()}
              className="rounded bg-gray-800 px-3 py-1 text-sm text-white hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300"
            >
              {loading === "reaction" ? "Saving…" : "Add reaction"}
            </button>
          </div>
          {reflectionsToShow.length > 0 && (
            <p className="text-sm text-gray-500">
              Reactions: {reflectionsToShow.map((r) => r.reaction).filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
