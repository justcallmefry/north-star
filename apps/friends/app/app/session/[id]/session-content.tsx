"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Mic } from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/loading-spinner";
import { submitResponse, revealSession, submitReflection } from "@/lib/sessions";
import type { GetSessionResult } from "@/lib/sessions";
import { NotifyPartnerButton } from "../../notify-partner-button";

const AFTER_REVEAL_PAUSE_MS = 1000;
const AFTER_REVEAL_LINE = "You showed up for each other today.";

type Props = { data: GetSessionResult; currentUserId: string };

export function SessionContent({ data, currentUserId }: Props) {
  const router = useRouter();
  const [text, setText] = useState(data.userResponse ?? "");
  const [reaction, setReaction] = useState<string>("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [afterRevealReady, setAfterRevealReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any | null>(null);
  const [revealData, setRevealData] = useState<{
    promptText: string;
    responses: { userId: string; content: string | null }[];
    reflections: { userId: string; content: string | null; reaction: string | null }[];
  } | null>(null);

  // Clear submit loading once refreshed data shows the user has responded
  useEffect(() => {
    if (data.userResponse != null && loading === "submit") setLoading(null);
  }, [data.userResponse, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("submit");
    try {
      await submitResponse(data.sessionId, text);
      toast.success("Answer saved.");
      router.refresh();
      // Keep loading as "submit" until refreshed data arrives (see useEffect below)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
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
      toast.success("Revealed.");
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
      await submitReflection(data.sessionId, undefined, reaction.trim());
      setReaction("");
      toast.success("Response sent.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(null);
    }
  }

  function ensureRecognition() {
    if (typeof window === "undefined") return null;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event: any) => {
        const results = event.results;
        if (!results || results.length === 0) return;
        let transcript = "";
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result.isFinal && result[0]) {
            transcript += (result[0].transcript ?? "") + (i < results.length - 1 ? " " : "");
          }
        }
        if (transcript.trim()) {
          setText((prev) =>
            prev ? `${prev}${prev.endsWith(" ") ? "" : " "}${transcript.trim()}` : transcript.trim()
          );
        }
      };
      recognition.onerror = (event: any) => {
        if (event.error !== "aborted" && event.error !== "no-speech") {
          setError("We couldn't hear you clearly. You can try again or type instead.");
        }
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

  useEffect(() => {
    if (!isRevealed) return;
    const t = setTimeout(() => setAfterRevealReady(true), AFTER_REVEAL_PAUSE_MS);
    return () => clearTimeout(t);
  }, [isRevealed]);

  const responsesToShow = useMemo(() => {
    if (!isRevealed) return [];

    const possessive = (name: string) =>
      `${name.trim()}${name.trim().endsWith("s") ? "'" : "'s"}`;
    const myTitle = data.currentUserName
      ? `${possessive(data.currentUserName)} response`
      : "My response";
    const partnerTitle = data.partnerName
      ? `${possessive(data.partnerName)} response`
      : "Their response";
    const myIcon = (data.currentUserImage as string) || "💗";
    const partnerIcon = (data.partnerImage as string) || "💜";

    if (revealData) {
      const mine = revealData.responses.find((r) => r.userId === currentUserId) ?? null;
      const partner = revealData.responses.find((r) => r.userId !== currentUserId) ?? null;
      return [
        {
          key: "me",
          title: myTitle,
          icon: myIcon,
          bubbleClass: "border-brand-200 bg-brand-50 text-slate-900",
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
        bubbleClass: "border-brand-200 bg-brand-50 text-slate-900",
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
  }, [isRevealed, revealData, data.userResponse, data.partnerResponse, data.partnerName, data.currentUserName, data.currentUserImage, data.partnerImage, currentUserId]);
  const reflectionsToShow = revealData?.reflections ?? data.reflections ?? [];

  const responseCount = (data.hasUserResponded ? 1 : 0) + (data.hasPartnerResponded ? 1 : 0);

  return (
    <div className="space-y-10">
      <p className="text-center text-3xl font-semibold leading-relaxed text-slate-900 sm:text-4xl">
        {data.promptText}
      </p>

      {data.momentText && (
        <div className="ns-card mx-auto max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 sm:text-sm">
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
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-lg leading-relaxed text-slate-900 placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
              required
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={isRecording ? handleStopVoice : handleStartVoice}
                className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-800 px-4 py-2.5 text-base font-medium text-white shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <Mic className="h-4 w-4 text-white" aria-hidden />
                </span>
                <span>{isRecording ? "Stop listening" : "Speak answer"}</span>
              </button>
            </div>
          </div>
          <p className="text-center text-base text-slate-700 sm:text-lg">
            {data.hasUserResponded
              ? "You can tweak your answer any time before you both reveal."
              : "Your answer stays private until your partner responds."}
          </p>
          <div className="flex flex-col items-center gap-4">
            {loading === "submit" ? (
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner size="sm" />
                <p className="text-sm text-slate-600">Saving your answer…</p>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!!loading}
                className="ns-btn-primary min-w-[10rem] text-lg transition-all duration-200 disabled:opacity-50"
              >
                {data.hasUserResponded ? "Update my answer" : "Save my answer"}
              </button>
            )}
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
        <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-base text-brand-800 sm:text-lg">
          <p>Waiting on your partner to answer. You can reveal once both have responded.</p>
          <div className="flex flex-wrap gap-2">
            <NotifyPartnerButton sessionId={data.sessionId} />
          </div>
        </div>
      )}

      {data.hasUserResponded && data.state === "open" && data.canReveal && !isRevealed && (
        <div>
          <p className="mb-2 text-base text-slate-700 sm:text-lg">Both of you have answered.</p>
          <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReveal}
            disabled={!!loading}
            className="ns-btn-primary text-lg"
          >
            {loading === "reveal" ? "Revealing…" : "Reveal answers"}
          </button>
          <NotifyPartnerButton sessionId={data.sessionId} messageType="reveal" size="sm" />
          </div>
        </div>
      )}

      {isRevealed && !afterRevealReady && (
        <div className="flex min-h-[12rem] items-center justify-center" aria-hidden="true">
          <p className="text-slate-400 text-lg">—</p>
        </div>
      )}

      {isRevealed && afterRevealReady && (
        <div className="animate-calm-fade-in ns-card ns-stack-tight">
          <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">Answers</h3>

          <div className="space-y-4">
            {responsesToShow.map((resp) => (
              <div key={resp.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-base">
                    {typeof resp.icon === "string" && resp.icon.trim().startsWith("http") ? (
                      <img src={resp.icon.trim()} alt="" className="absolute inset-0 h-full w-full object-cover" width={32} height={32} />
                    ) : (
                      resp.icon
                    )}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${resp.bubbleClass}`}
                  >
                    {resp.title}
                  </span>
                </div>
                <p className="ns-card-inner p-3 text-lg leading-relaxed text-slate-900 sm:text-xl">
                  {resp.content ?? "—"}
                </p>
              </div>
            ))}
          </div>

          <p className="text-center text-lg font-medium text-brand-700 sm:text-xl">
            {AFTER_REVEAL_LINE}
          </p>

          <div className="space-y-3 border-t border-brand-100 pt-5">
            <label htmlFor="session-response" className="block text-sm font-medium text-slate-700">
              Send a response back
            </label>
            <textarea
              id="session-response"
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              placeholder="A short note or emoji for your partner…"
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
            />
            <button
              type="button"
              onClick={handleReaction}
              disabled={!!loading || !reaction.trim()}
              className="ns-btn-primary"
            >
              {loading === "reaction" ? "Saving…" : "Send response"}
            </button>
          </div>
          {reflectionsToShow.length > 0 && (
            <div className="space-y-2 pt-2">
              {reflectionsToShow.map((r) => {
                const text = r.content || r.reaction;
                if (!text) return null;
                const isMe = r.userId === currentUserId;
                return (
                  <p key={r.userId} className="text-base text-slate-700 sm:text-lg">
                    <span className="font-medium text-slate-900">
                      {isMe
                        ? `${data.currentUserName ? `${data.currentUserName.trim()}: ` : "My response: "}`
                        : `${data.partnerName ? `${data.partnerName.trim()}: ` : "Their response: "}`}
                    </span>
                    {text}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
          <p className="text-base sm:text-lg">{error}</p>
        </div>
      )}
    </div>
  );
}
