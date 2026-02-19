"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { submitResponse, revealSession, submitReflection } from "@/lib/sessions";
import type { GetSessionResult } from "@/lib/sessions";
import { NotifyPartnerButton } from "../../notify-partner-button";

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
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any | null>(null);
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

  function ensureRecognition() {
    if (typeof window === "undefined") return null;
    // Some browsers expose webkitSpeechRecognition instead of SpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript as string;
        setText((prev) =>
          prev
            ? `${prev}${prev.endsWith(" ") ? "" : " "}${transcript.trim()}`
            : transcript.trim()
        );
      };
      recognition.onerror = () => {
        setError("We couldn’t hear you clearly. You can try again or type instead.");
        setIsRecording(false);
      };
      recognition.onend = () => {
        setIsRecording(false);
      };
      recognitionRef.current = recognition;
    }
    return recognitionRef.current;
  }

  function handleStartVoice() {
    setError(null);
    const recognition = ensureRecognition();
    if (!recognition) {
      setError("Voice input isn’t supported in this browser. You can still type your answer.");
      return;
    }
    try {
      recognition.start();
      setIsRecording(true);
    } catch {
      // If start fails (e.g. already started), just reset state
      setIsRecording(false);
    }
  }

  function handleStopVoice() {
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    }
    setIsRecording(false);
  }

  const isRevealed = revealed || data.state === "revealed";
  const affirmation = useMemo(
    () => AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)],
    []
  );
  const myTitle = "My response";
  const partnerTitle = data.partnerName
    ? `${data.partnerName.trim()}${data.partnerName.trim().endsWith("s") ? "'" : "'s"} response`
    : "Their response";
  const myIcon = (data.currentUserImage as string) || "💗";
  const partnerIcon = (data.partnerImage as string) || "💜";

  const responsesToShow = useMemo(() => {
    if (!isRevealed) return [];

    if (revealData) {
      const mine = revealData.responses.find((r) => r.userId === currentUserId) ?? null;
      const partner = revealData.responses.find((r) => r.userId !== currentUserId) ?? null;
      return [
        {
          key: "me",
          title: myTitle,
          icon: myIcon,
          bubbleClass: "border-pink-200 bg-pink-50 text-slate-900",
          content: mine?.content ?? null,
        },
        {
          key: "partner",
          title: partnerTitle,
          icon: partnerIcon,
          bubbleClass: "border-violet-100 bg-violet-50 text-slate-900",
          content: partner?.content ?? null,
        },
      ];
    }

    return [
      {
        key: "me",
        title: myTitle,
        icon: myIcon,
        bubbleClass: "border-pink-200 bg-pink-50 text-slate-900",
        content: data.userResponse ?? null,
      },
      {
        key: "partner",
        title: partnerTitle,
        icon: partnerIcon,
        bubbleClass: "border-violet-100 bg-violet-50 text-slate-900",
        content: data.partnerResponse ?? null,
      },
    ];
  }, [
    isRevealed,
    revealData,
    data.userResponse,
    data.partnerResponse,
    data.partnerName,
    data.currentUserImage,
    data.partnerImage,
    currentUserId,
    myTitle,
    partnerTitle,
    myIcon,
    partnerIcon,
  ]);
  const reflectionsToShow = revealData?.reflections ?? data.reflections ?? [];

  const responseCount = (data.hasUserResponded ? 1 : 0) + (data.hasPartnerResponded ? 1 : 0);

  return (
    <div className="space-y-10">
      <p className="font-display text-center text-3xl leading-relaxed text-slate-900 sm:text-4xl">
        {data.promptText}
      </p>

      {data.momentText && (
        <div className="mx-auto max-w-xl rounded-xl border border-pink-100 bg-white px-4 py-3 shadow-sm shadow-pink-100/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-500 sm:text-sm">
            Optional moment
          </p>
          <p className="mt-1.5 text-base leading-relaxed text-slate-700 sm:text-lg">
            {data.momentText}
          </p>
        </div>
      )}

      {data.state === "open" && (
        <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-6">
          <div className="space-y-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Your answer..."
              rows={5}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-lg leading-relaxed text-slate-900 placeholder:text-slate-500 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300"
              required
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={isRecording ? handleStopVoice : handleStartVoice}
                className="inline-flex items-center gap-1 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700 shadow-sm hover:border-pink-300 hover:bg-pink-100"
              >
                <span>{isRecording ? "Stop listening" : "Speak answer"}</span>
                <span aria-hidden="true">🎤</span>
              </button>
            </div>
          </div>
          <p className="text-center text-base text-slate-700 sm:text-lg">
            {data.hasUserResponded
              ? "You can tweak your answer any time before you both reveal."
              : "Your answer stays private until your partner responds."}
          </p>
          <div className="flex flex-col items-center gap-4">
            <button
              type="submit"
              disabled={!!loading}
              className="rounded-lg bg-pink-500 px-7 py-3.5 text-lg font-semibold text-white shadow-sm shadow-pink-300/60 hover:bg-pink-400 disabled:opacity-50"
            >
              {loading === "submit"
                ? "Saving…"
                : data.hasUserResponded
                  ? "Update my answer"
                  : "Save my answer"}
            </button>
            <p className="text-base text-slate-600 sm:text-lg">
              {responseCount} of 2 responses for today.
            </p>
          </div>
        </form>
      )}

      {data.hasUserResponded && (
        <p className="text-center text-base text-slate-700 sm:text-lg">
          {data.canReveal
            ? "2 of 2 responses for today."
            : "You're 1 of 2 responses for today."}
        </p>
      )}

      {data.hasUserResponded && data.state === "open" && !data.canReveal && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-base text-amber-800 sm:text-lg">
          <p>Waiting on your partner to answer. You can reveal once both have responded.</p>
          <div className="flex flex-wrap gap-2">
            <NotifyPartnerButton sessionId={data.sessionId} />
          </div>
        </div>
      )}

      {data.hasUserResponded && data.state === "open" && data.canReveal && !isRevealed && (
        <div>
          <p className="mb-2 text-base text-slate-700 sm:text-lg">Both of you have answered.</p>
            <button
              type="button"
              onClick={handleReveal}
              disabled={!!loading}
              className="rounded-lg bg-pink-500 px-6 py-2.5 text-lg font-semibold text-white shadow-sm shadow-pink-300/60 hover:bg-pink-400 disabled:opacity-50"
            >
            {loading === "reveal" ? "Revealing…" : "Reveal answers"}
          </button>
        </div>
      )}

      {isRevealed && (
        <div className="space-y-5 rounded-2xl border border-pink-100 bg-white p-4 shadow-md shadow-pink-100/80">
          <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">Answers</h3>

          <div className="space-y-4">
            {responsesToShow.map((resp) => (
              <div key={resp.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-base">
                    {resp.icon}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${resp.bubbleClass}`}
                  >
                    {resp.title}
                  </span>
                </div>
                <p className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-lg leading-relaxed text-slate-900 sm:text-xl">
                  {resp.content ?? "—"}
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              placeholder="Quick reaction (e.g. 💕)"
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={handleReaction}
              disabled={!!loading || !reaction.trim()}
              className="rounded-lg bg-pink-500 px-5 py-2.5 text-base font-semibold text-white shadow-sm shadow-pink-300/60 hover:bg-pink-400 disabled:opacity-50"
            >
              {loading === "reaction" ? "Saving…" : "Add reaction"}
            </button>
          </div>
          {reflectionsToShow.length > 0 && (
            <p className="text-base text-slate-700 sm:text-lg">
              Reactions: {reflectionsToShow.map((r) => r.reaction).filter(Boolean).join(", ")}
            </p>
          )}
          <p className="pt-3 text-center text-base text-slate-700 sm:text-lg">
            {affirmation}
          </p>
        </div>
      )}

      {error && (
        <p className="text-base text-red-500 sm:text-lg">{error}</p>
      )}
    </div>
  );
}
