"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { submitResponse, revealSession, submitReflection } from "@/lib/sessions";
import type { GetSessionResult } from "@/lib/sessions";

const AFFIRMATIONS = [
  "Thanks for showing up for each other.",
  "Moments like this build trust.",
  "Small check-ins add up.",
  "You showed up. That matters.",
  "Good to connect.",
];

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
  const affirmation = useMemo(
    () => AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)],
    []
  );
  const responsesToShow: (string | null)[] = revealData
    ? revealData.responses.map((r) => r.content ?? null)
    : isRevealed
      ? [data.userResponse ?? null, data.partnerResponse ?? null]
      : [];
  const reflectionsToShow = revealData?.reflections ?? data.reflections ?? [];

  const responseCount = (data.hasUserResponded ? 1 : 0) + (data.hasPartnerResponded ? 1 : 0);

  return (
    <div className="space-y-8">
      <p className="text-center text-xl leading-relaxed text-slate-50 sm:text-2xl">
        {data.promptText}
      </p>

      {data.momentText && (
        <div className="mx-auto max-w-xl rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Optional moment
          </p>
          <p className="mt-1.5 text-base leading-relaxed text-slate-200 sm:text-lg">
            {data.momentText}
          </p>
        </div>
      )}

      {!data.hasUserResponded && (
        <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Your answer..."
            rows={5}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-base leading-relaxed text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            required
          />
          <p className="text-center text-sm text-slate-400 sm:text-base">
            Your answer stays private until your partner responds.
          </p>
          <div className="flex flex-col items-center gap-3">
            <button
              type="submit"
              disabled={!!loading}
              className="rounded-lg bg-emerald-500 px-6 py-3 text-base font-semibold text-emerald-950 shadow-sm shadow-emerald-500/30 hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading === "submit" ? "Saving…" : "Save my answer"}
            </button>
            <p className="text-xs text-slate-400 sm:text-sm">
              {responseCount} of 2 responses for today.
            </p>
          </div>
        </form>
      )}

      {data.hasUserResponded && (
        <p className="text-center text-sm text-slate-400 sm:text-base">
          {data.canReveal
            ? "2 of 2 responses for today."
            : "You're 1 of 2 responses for today."}
        </p>
      )}

      {data.hasUserResponded && data.state === "open" && !data.canReveal && (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200 sm:text-base">
          Waiting on your partner to answer. You can reveal once both have responded.
        </p>
      )}

      {data.hasUserResponded && data.state === "open" && data.canReveal && !isRevealed && (
        <div>
          <p className="mb-2 text-sm text-slate-300 sm:text-base">Both of you have answered.</p>
            <button
              type="button"
              onClick={handleReveal}
              disabled={!!loading}
              className="rounded-lg bg-sky-500 px-5 py-2 text-base font-semibold text-slate-950 shadow-sm shadow-sky-500/30 hover:bg-sky-400 disabled:opacity-50"
            >
            {loading === "reveal" ? "Revealing…" : "Reveal answers"}
          </button>
        </div>
      )}

      {isRevealed && (
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
          <h3 className="text-base font-semibold text-slate-50 sm:text-lg">Answers</h3>
          <ul className="space-y-2">
            {responsesToShow.map((content, i) => (
              <li key={i} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-base text-slate-100 sm:text-lg">
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
              className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={handleReaction}
              disabled={!!loading || !reaction.trim()}
              className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-emerald-950 shadow-sm shadow-emerald-500/30 hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading === "reaction" ? "Saving…" : "Add reaction"}
            </button>
          </div>
          {reflectionsToShow.length > 0 && (
            <p className="text-sm text-slate-400 sm:text-base">
              Reactions: {reflectionsToShow.map((r) => r.reaction).filter(Boolean).join(", ")}
            </p>
          )}
          <p className="pt-3 text-center text-sm text-slate-400 sm:text-base">
            {affirmation}
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 sm:text-base">{error}</p>
      )}
    </div>
  );
}
