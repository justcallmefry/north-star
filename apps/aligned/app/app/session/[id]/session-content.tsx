"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Mic } from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/loading-spinner";
import { submitResponse, revealSession, submitReflection } from "@/lib/sessions";
import type { GetSessionResult } from "@/lib/sessions";
import { DedicationBadge } from "../../dedication-badge";
import { NotifyPartnerButton } from "../../notify-partner-button";
import { StreakBadge } from "../../streak-badge";
import { StreakShareCard } from "./streak-share-card";
import { RevealStamp } from "@/components/reveal-stamp";
import { haptic } from "@/lib/haptics";
import { WaitingForPartner } from "./waiting-for-partner";
import { PreRevealGuess, readGuess } from "./pre-reveal-guess";
import { StreakCelebration, isStreakMilestone } from "@/components/streak-celebration";
import { SaveMemoryButton } from "./save-memory-button";
import { StickerRow } from "./sticker-row";
import { MilestonePromptCard } from "../../milestone-prompt-card";
import type { MilestoneContext } from "@/lib/milestones";

const AFTER_REVEAL_PAUSE_MS = 1100;

const FOLLOW_UP_PROMPTS: Record<string, string[]> = {
  gratitude: [
    "When was the last time you told each other this out loud?",
    "What's one small thing from this week you both want to hold onto?",
    "Is there something you've been grateful for but haven't said yet?",
  ],
  communication: [
    "Is there a version of this you want to revisit in a real conversation tonight?",
    "What's one thing you wish the other understood more deeply about you here?",
    "Is this something you've talked about before, or is it new?",
  ],
  reflection: [
    "Has your thinking on this changed over time — and does your partner know?",
    "What surprised you about their answer?",
    "Is this something you'd want to revisit in a year?",
  ],
  fun: [
    "Would you actually do this together — or is it purely hypothetical?",
    "Which of you would be worse at this?",
    "What's the story behind your answer?",
  ],
  growth: [
    "Is this an area where you want the other's support — or just their understanding?",
    "What would change if you both took a small step on this together?",
    "Did their answer surprise you or confirm what you already knew?",
  ],
  other: [
    "What did their answer make you feel?",
    "Is there more to say about this that the question didn't leave room for?",
    "What's one thing you want to remember about today's answers?",
  ],
};

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by","from","is","are",
  "was","were","be","been","being","have","has","had","do","does","did","will","would","could",
  "should","may","might","i","you","we","they","he","she","it","my","your","our","their","his",
  "her","its","this","that","these","those","what","when","where","how","why","just","so","up",
  "about","like","than","then","into","also","more","not","no","if","as","me","him","us","them",
  "very","really","its","get","got","go","some","any","out","all","can","one","two","your","my",
]);

function extractWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
  );
}

function findSharedWords(responses: { content: string | null }[]): string[] {
  const nonEmpty = responses.map((r) => r.content ?? "").filter(Boolean);
  if (nonEmpty.length < 2) return [];
  const sets = nonEmpty.map(extractWords);
  const shared = [...sets[0]!].filter((w) => sets.slice(1).every((s) => s.has(w)));
  return shared.slice(0, 3);
}

function pickFollowUp(category: string | null | undefined, sessionId: string): string {
  const pool = FOLLOW_UP_PROMPTS[category ?? "other"] ?? FOLLOW_UP_PROMPTS.other;
  // Deterministic pick so it doesn't jump on re-render
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash * 31 + sessionId.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length]!;
}

function streakMilestoneContext(count: number | null | undefined): MilestoneContext | null {
  if (count === 7) return "streak-7";
  if (count === 30) return "streak-30";
  if (count === 100) return "streak-100";
  if (count === 365) return "streak-365";
  return null;
}

const STREAK_MILESTONE_EYEBROW: Record<string, string> = {
  "streak-7": "One week milestone",
  "streak-30": "30-day milestone",
  "streak-100": "100-day milestone",
  "streak-365": "One year milestone",
};

type Props = { data: GetSessionResult; currentUserId: string };

export function SessionContent({ data, currentUserId }: Props) {
  const router = useRouter();
  const [text, setText] = useState(data.userResponse ?? "");
  const [reaction, setReaction] = useState<string>("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [afterRevealReady, setAfterRevealReady] = useState(false);
  const [partnerRevealed, setPartnerRevealed] = useState(false);
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
      void haptic("success");
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
    setPartnerRevealed(false);
    try {
      const result = await revealSession(data.sessionId);
      setRevealData(result);
      setRevealed(true);
      void haptic("reveal");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reveal");
    } finally {
      setLoading(null);
    }
  }

  function handleRevealPartner() {
    setPartnerRevealed(true);
    void haptic("reveal");
  }

  async function handleReaction() {
    if (!reaction.trim()) return;
    setError(null);
    setLoading("reaction");
    try {
      await submitReflection(data.sessionId, undefined, reaction.trim());
      setReaction("");
      void haptic("tap");
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

    const baseResponses =
      revealData?.responses ??
      (data.allResponses
        ? data.allResponses.map((r) => ({
            userId: r.userId,
            content: r.content ?? null,
          }))
        : []);

    if (baseResponses.length === 0) {
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
      return [
        {
          key: "me",
          title: myTitle,
          icon: myIcon,
          bubbleClass: "border-brand-200 bg-brand-50 text-slate-900",
          content: data.userResponse ?? null,
          isMe: true,
        },
        {
          key: "partner",
          title: partnerTitle,
          icon: partnerIcon,
          bubbleClass: "border-violet-100 bg-violet-50 text-slate-900",
          content: data.partnerResponse ?? null,
          isMe: false,
        },
      ];
    }

    const withMeta =
      data.allResponses && data.allResponses.length >= baseResponses.length
        ? baseResponses.map((r) => {
            const meta = data.allResponses!.find((m) => m.userId === r.userId);
            return {
              userId: r.userId,
              content: r.content,
              name: meta?.name ?? null,
              image: meta?.image ?? null,
            };
          })
        : baseResponses.map((r) => ({
            userId: r.userId,
            content: r.content,
            name: null,
            image: null,
          }));

    const sorted = withMeta.sort((a, b) => {
      if (a.userId === currentUserId) return -1;
      if (b.userId === currentUserId) return 1;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });

    return sorted.map((r, index) => {
      const isMe = r.userId === currentUserId;
      const fallbackLabel = isMe ? "My response" : "Their response";
      const title = r.name ? `${r.name}'s response` : fallbackLabel;
      const icon = r.image || (isMe ? "💗" : index === 1 ? "💜" : "💛");
      const bubbleClass = isMe
        ? "border-brand-200 bg-brand-50 text-slate-900"
        : "border-violet-100 bg-violet-50 text-slate-900";
      return {
        key: r.userId,
        title,
        icon,
        bubbleClass,
        content: r.content ?? null,
        isMe,
      };
    });
  }, [isRevealed, revealData, data.userResponse, data.partnerResponse, data.allResponses, data.partnerName, data.currentUserName, data.currentUserImage, data.partnerImage, currentUserId]);

  const savedGuess = useMemo(() => {
    if (!isRevealed) return null;
    return readGuess(data.sessionId);
  }, [isRevealed, data.sessionId]);
  const reflectionsToShow = revealData?.reflections ?? data.reflections ?? [];

  const totalMembers = data.memberCount ?? 2;
  const respondedCount = data.respondedCount ?? ((data.hasUserResponded ? 1 : 0) + (data.hasPartnerResponded ? totalMembers - 1 : 0));
  const afterRevealLine = data.isFirstCompletedSession
    ? "You just did the hard part — you showed up for each other. This can be your new daily rhythm."
    : "You showed up for each other today.";

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
              ? totalMembers === 2
                ? "You can tweak your answer any time before you both reveal."
                : "You can tweak your answer any time before everyone reveals."
              : totalMembers === 2
                ? "Your answer stays private until your partner responds."
                : "Your answer stays private until everyone has responded."}
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
                className="ns-btn-primary w-full py-3.5 text-lg transition-all duration-200 disabled:opacity-50"
              >
                {data.hasUserResponded ? "Update my answer" : "Save my answer"}
              </button>
            )}
            <p className="text-base text-slate-600 sm:text-lg">
              {respondedCount} of {totalMembers} responses for today.
            </p>
          </div>
        </form>
      )}

      {data.hasUserResponded && (
        <p className="text-center text-base text-slate-700 sm:text-lg">
          {data.canReveal
            ? `${respondedCount} of ${totalMembers} responses for today.`
            : `You're 1 of ${totalMembers} responses for today.`}
        </p>
      )}

      {data.hasUserResponded && data.state === "open" && !data.canReveal && (
        <WaitingForPartner
          sessionId={data.sessionId}
          relationshipId={data.relationshipId}
          partnerName={data.partnerName ?? null}
          partnerImage={(data.partnerImage as string | null) ?? null}
          totalMembers={totalMembers}
        />
      )}

      {data.hasUserResponded && data.state === "open" && data.canReveal && !isRevealed && (
        <div className="space-y-3">
          <p className="text-base text-slate-700 sm:text-lg">Both of you have answered.</p>
          {data.partnerGuessEnabled && (
            <PreRevealGuess
              sessionId={data.sessionId}
              partnerName={data.partnerName ?? null}
            />
          )}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleReveal}
              disabled={!!loading}
              className="ns-btn-primary w-full py-3.5 text-lg"
            >
              {loading === "reveal" ? "Revealing…" : "Reveal answers"}
            </button>
            <NotifyPartnerButton sessionId={data.sessionId} relationshipId={data.relationshipId} messageType="reveal" size="sm" className="w-full py-2.5" />
          </div>
        </div>
      )}

      {isRevealed && !afterRevealReady && (
        <div
          className="flex min-h-[12rem] flex-col items-center justify-center gap-3"
          aria-live="polite"
          aria-label="Revealing answers"
        >
          <div className="animate-reveal-shimmer flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-violet-100">
            <span className="text-2xl" aria-hidden>✦</span>
          </div>
          <p className="text-sm uppercase tracking-[0.18em] text-brand-600">Revealing</p>
        </div>
      )}

      {isRevealed && afterRevealReady && (
        <div className="ns-stack-tight">
          {isStreakMilestone(data.streak?.currentCount) ? (
            <>
              <StreakCelebration count={data.streak!.currentCount} />
              {streakMilestoneContext(data.streak!.currentCount) && (
                <MilestonePromptCard
                  relationshipId={data.relationshipId}
                  context={streakMilestoneContext(data.streak!.currentCount)!}
                  eyebrow={STREAK_MILESTONE_EYEBROW[streakMilestoneContext(data.streak!.currentCount)!] ?? "Milestone question"}
                />
              )}
            </>
          ) : (
            <RevealStamp
              eyebrow={
                data.streak?.currentCount && data.streak.currentCount > 0
                  ? `Day ${data.streak.currentCount}`
                  : null
              }
              totalMembers={totalMembers}
            />
          )}

          <div className="animate-calm-fade-in ns-card ns-stack-tight">
          <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">Answers</h3>

          <div className="space-y-2">
            {/* Two-step reveal: my answer first, then partner tap-to-reveal.
                Skip two-step if already revealed on page load (data.state === "revealed"). */}
            {responsesToShow.map((resp, idx) => {
              const isPartnerAnswer = !resp.isMe;
              const needsTap = isPartnerAnswer && revealed && !partnerRevealed && data.state !== "revealed";
              if (needsTap) return null;
              return (
                <div
                  key={resp.key}
                  className={`animate-reveal-cascade space-y-1.5 ${
                    idx === 0
                      ? "reveal-cascade-delay-1"
                      : idx === 1
                        ? "reveal-cascade-delay-2"
                        : idx === 2
                          ? "reveal-cascade-delay-3"
                          : "reveal-cascade-delay-4"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-base">
                      {typeof resp.icon === "string" && resp.icon.trim().startsWith("http") ? (
                        <img src={resp.icon.trim()} alt="" className="absolute inset-0 h-full w-full object-cover" width={36} height={36} />
                      ) : (
                        resp.icon
                      )}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.14em] ${resp.bubbleClass}`}
                    >
                      {resp.title}
                    </span>
                  </div>
                  <p className="ns-card-inner px-3 py-3 text-2xl leading-relaxed text-slate-900 sm:text-3xl">
                    {resp.content ?? "—"}
                  </p>
                  {!resp.isMe && savedGuess && (
                    <p className="px-3 text-sm italic text-slate-500 sm:text-base">
                      <span className="font-medium not-italic text-slate-600">You guessed: </span>
                      {savedGuess}
                    </p>
                  )}
                </div>
              );
            })}
            {/* Partner reveal button — shown after my answer is visible, before partner is revealed */}
            {revealed && !partnerRevealed && data.state !== "revealed" && responsesToShow.some((r) => !r.isMe) && (
              <button
                type="button"
                onClick={handleRevealPartner}
                className="mt-2 w-full rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/60 px-4 py-5 text-center transition hover:bg-brand-50 active:scale-[0.98]"
              >
                <p className="text-base font-semibold text-brand-700">
                  Ready to see what {data.partnerName ?? "they"} wrote?
                </p>
                <p className="mt-1 text-sm text-slate-500">Tap to reveal</p>
              </button>
            )}
          </div>

          {/* Shared-word highlight */}
          {(partnerRevealed || data.state === "revealed") && (() => {
            const shared = findSharedWords(responsesToShow);
            if (shared.length === 0) return null;
            return (
              <div className="flex flex-wrap items-center justify-center gap-2 py-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  You both mentioned
                </span>
                {shared.map((w) => (
                  <span
                    key={w}
                    className="rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700"
                  >
                    {w}
                  </span>
                ))}
              </div>
            );
          })()}

          <p className="text-center text-lg font-medium text-brand-700 sm:text-xl">
            {afterRevealLine}
          </p>

          {/* Follow-up conversation prompt — bridges the app to a real conversation */}
          {(partnerRevealed || data.state === "revealed") && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Talk about it
              </p>
              <p className="mt-1.5 text-base leading-relaxed text-slate-700 sm:text-lg">
                {pickFollowUp(data.promptCategory, data.sessionId)}
              </p>
            </div>
          )}

          {data.streak && data.streak.currentCount > 0 && (
            <div className="flex justify-center">
              <StreakBadge
                currentCount={data.streak.currentCount}
                longestCount={data.streak.longestCount}
                variant="full"
              />
            </div>
          )}

          {data.dedication && data.dedication.totalCheckIns > 0 && (
            <div className="flex justify-center">
              <DedicationBadge totalCheckIns={data.dedication.totalCheckIns} variant="full" />
            </div>
          )}

          {data.streak &&
            (data.streak.currentCount === 7 || data.streak.currentCount === 30) && (
              <StreakShareCard currentCount={data.streak.currentCount} />
            )}

          <SaveMemoryButton sessionId={data.sessionId} initialSaved={false} />

          <div className="space-y-3 border-t border-brand-100 pt-5">
            <StickerRow sessionId={data.sessionId} />

            {data.isFirstCompletedSession && (
              <p className="text-sm text-slate-600">
                Optional: What surprised you about your partner&apos;s answer, or what do you want to remember from today?
              </p>
            )}
            <label htmlFor="session-response" className="block text-sm font-medium text-slate-700">
              Or write a response
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
              className="ns-btn-primary w-full py-3.5"
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
