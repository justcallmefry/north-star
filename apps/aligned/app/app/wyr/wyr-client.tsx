"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitWyrChoice, submitWyrGuess } from "@/lib/wyr";
import type { WyrForTodayResult } from "@/lib/wyr";
import { haptic } from "@/lib/haptics";
import { useFlick } from "@/lib/use-flick";
import { NotifyPartnerQuizButton } from "../notify-partner-quiz-button";

type Props = { initialData: WyrForTodayResult; relationshipId: string };

export function WyrClient({ initialData, relationshipId }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [showReveal, setShowReveal] = useState(initialData.state === "revealed");
  const [animPhase, setAnimPhase] = useState<"idle" | "breathe" | "drumroll" | "slam">(
    initialData.state === "revealed" ? "slam" : "idle"
  );
  /** A card flicked away mid-pick: which one is leaving, and which way. */
  const [flyOff, setFlyOff] = useState<{ idx: 0 | 1; dir: "left" | "right" } | null>(null);

  // When partner submits and data refreshes to "revealed", play drumroll first
  useEffect(() => {
    if (data.state === "revealed" && !showReveal) {
      setAnimPhase("drumroll");
      const t = setTimeout(() => {
        setAnimPhase("slam");
        setShowReveal(true);
        void haptic("reveal");
      }, 700);
      return () => clearTimeout(t);
    }
  }, [data.state, showReveal]);

  // Start breathing when user has picked but partner hasn't revealed yet
  useEffect(() => {
    if (data.myChoice != null && data.state === "open") {
      setAnimPhase("breathe");
    }
  }, [data.myChoice, data.state]);

  // Sync local state when server delivers fresh initialData (e.g. after router.refresh())
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  async function handlePick(choice: 0 | 1) {
    if (loading) return;
    setLoading(true);
    try {
      await submitWyrChoice(data.wyrSessionId, choice);
      void haptic("tap");
      router.refresh();
      setData((prev) => ({ ...prev, myChoice: choice }));
    } catch (err) {
      setFlyOff(null);
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  /** Flick a card away = keep the other one. The physical version of picking. */
  function handleFlickAway(idx: 0 | 1, dir: "left" | "right") {
    if (loading || flyOff != null) return;
    setFlyOff({ idx, dir });
    void haptic("tap");
    // Let the fly-off + victor animations play before committing the pick.
    setTimeout(() => {
      void handlePick((1 - idx) as 0 | 1);
    }, 340);
  }

  async function handleCallIt(guess: 0 | 1) {
    if (loading) return;
    setLoading(true);
    const prevGuess = data.myGuess;
    setData((prev) => ({ ...prev, myGuess: guess }));
    try {
      await submitWyrGuess(data.wyrSessionId, guess);
      void haptic("tap");
      router.refresh();
    } catch (err) {
      setData((prev) => ({ ...prev, myGuess: prevGuess }));
      toast.error(err instanceof Error ? err.message : "Failed to save your call");
    } finally {
      setLoading(false);
    }
  }

  const { question, myChoice, myGuess, partnerSubmitted, partnerName, reveal } = data;

  return (
    <div className="animate-calm-fade-in space-y-6">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dusk-600">
          Would You Rather
        </p>
        <p className="text-sm text-slate-500">Pick one — no right answer.</p>
      </div>

      <div className="space-y-3">
        {myChoice == null && data.state === "open" ? (
          // Interactive: tap your pick, or physically flick away the other one.
          ([question.optionA, question.optionB] as const).map((label, i) => {
            const idx = i as 0 | 1;
            return (
              <FlickableOption
                key={idx}
                label={label}
                disabled={loading || flyOff != null}
                flyOffDir={flyOff?.idx === idx ? flyOff.dir : null}
                victor={flyOff != null && flyOff.idx !== idx}
                onPick={() => handlePick(idx)}
                onFlickAway={(dir) => handleFlickAway(idx, dir)}
              />
            );
          })
        ) : (
          ([question.optionA, question.optionB] as const).map((label, i) => {
            const idx = i as 0 | 1;
            const isMine = myChoice === idx;
            const isPartners = reveal?.partnerChoice === idx;
            const isRevealed = showReveal && reveal != null;

            let cardClass =
              "relative flex min-h-[88px] w-full items-center rounded-2xl border-2 px-5 py-4 text-left text-lg font-semibold leading-snug transition ";

            if (isRevealed) {
              cardClass += isMine && isPartners
                ? "border-brand-400 bg-brand-50 text-brand-900 animate-wyr-match-glow"
                : isMine
                  ? "border-brand-300 bg-brand-50/60 text-slate-900"
                  : isPartners
                    ? "border-violet-300 bg-violet-50/60 text-slate-900"
                    : "border-slate-100 bg-white text-slate-400";
              if (animPhase === "slam") cardClass += " animate-wyr-slam";
            } else {
              cardClass += isMine
                ? "border-brand-400 bg-brand-50 text-brand-900 -translate-y-1 shadow-md"
                : "border-slate-100 bg-white text-slate-400";
              if (animPhase === "breathe") cardClass += " animate-wyr-breathe";
              if (animPhase === "drumroll") cardClass += " animate-wyr-drumroll";
            }

            return (
              <div key={idx} className={cardClass}>
                <span className="flex-1">{label}</span>
                {isRevealed && (
                  <span className="ml-3 flex shrink-0 flex-col items-end gap-1 text-xs font-medium">
                    {isMine && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-brand-700">You</span>
                    )}
                    {isPartners && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">
                        {partnerName ?? "Them"}
                      </span>
                    )}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* States */}
      {myChoice == null && (
        <p className="text-center text-sm text-slate-400">
          Tap your pick — or flick away the one that&apos;s not you. Your choice stays hidden until they answer.
        </p>
      )}

      {myChoice != null && data.state === "open" && !partnerSubmitted && (
        <div className="rounded-2xl border border-dusk-100 bg-gradient-to-br from-dusk-50 to-white p-5 text-center">
          <p className="text-base font-semibold text-slate-900">{partnerName ?? "Them"} hasn&apos;t picked yet.</p>
          <p className="mt-1 text-sm text-slate-600">Your choice is locked in. We&apos;ll reveal the match the moment they do.</p>

          {myGuess == null ? (
            <div className="mt-4 border-t border-dusk-100 pt-4">
              <p className="text-sm font-semibold text-dusk-700">
                While you wait — call it. Which way did {partnerName ?? "they"} go?
              </p>
              <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
                {([question.optionA, question.optionB] as const).map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={loading}
                    onClick={() => handleCallIt(i as 0 | 1)}
                    className="flex-1 rounded-xl border border-dusk-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-dusk-400 hover:bg-dusk-50 active:scale-[0.98]"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">Optional — they&apos;ll never see your call.</p>
            </div>
          ) : (
            <p className="mt-4 border-t border-dusk-100 pt-4 text-sm text-dusk-700">
              <span className="font-semibold">Your call:</span>{" "}
              {myGuess === 0 ? question.optionA : question.optionB}. Locked in — let&apos;s see.
            </p>
          )}

          <div className="mt-4">
            <NotifyPartnerQuizButton variant="wyr" relationshipId={relationshipId} size="sm" />
          </div>
        </div>
      )}

      {animPhase === "drumroll" && (
        <div className="rounded-2xl border border-dusk-100 bg-gradient-to-br from-dusk-50 to-white p-5 text-center animate-pulse">
          <p className="text-base font-semibold text-slate-900">Both picks are in.</p>
          <p className="mt-1 text-sm text-slate-600">Revealing your match now…</p>
        </div>
      )}

      {showReveal && reveal && (
        reveal.matched ? (
          <div className="animate-wyr-match-burst rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-brand-50 px-5 py-5 text-center space-y-2">
            <p className="text-2xl" aria-hidden>✦</p>
            <p className="text-xl font-semibold text-emerald-800">You matched.</p>
            <p className="text-sm text-slate-600">Same instinct — that says something. Ask each other why.</p>
          </div>
        ) : (
          <div className="animate-wyr-mismatch-reveal rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/60 via-white to-white px-5 py-5 text-center space-y-2">
            <p className="text-2xl" aria-hidden>↔</p>
            <p className="text-xl font-semibold text-slate-800">You went different ways.</p>
            <p className="text-sm text-slate-600">Neither is wrong. This one&apos;s worth talking about tonight.</p>
          </div>
        )
      )}

      {showReveal && reveal && reveal.calledIt != null && (
        reveal.calledIt ? (
          <div className="animate-wyr-match-burst mx-auto w-fit rounded-full border border-dusk-200 bg-gradient-to-r from-dusk-50 to-brand-50 px-4 py-2 text-center">
            <p className="text-sm font-semibold text-dusk-800">
              🔮 You called it — you knew they&apos;d pick{" "}
              {reveal.partnerChoice === 0 ? question.optionA.toLowerCase() : question.optionB.toLowerCase()}.
            </p>
          </div>
        ) : (
          <p className="text-center text-sm text-slate-500">
            You called it the other way — {partnerName ?? "they"} surprised you. Even better.
          </p>
        )
      )}
    </div>
  );
}

/**
 * A WYR option you can tap to pick — or grab and flick off-screen to discard,
 * which picks the one you kept. Vertical scrolling stays free (touch-action).
 */
function FlickableOption({
  label,
  disabled,
  flyOffDir,
  victor,
  onPick,
  onFlickAway,
}: {
  label: string;
  disabled: boolean;
  /** Set when this card is the one being thrown away. */
  flyOffDir: "left" | "right" | null;
  /** True when the *other* card was thrown — this one springs forward. */
  victor: boolean;
  onPick: () => void;
  onFlickAway: (dir: "left" | "right") => void;
}) {
  const flick = useFlick({
    disabled: disabled || flyOffDir != null,
    onFlick: onFlickAway,
  });

  const style: React.CSSProperties = { touchAction: "pan-y" };
  if (flick.dragging) {
    style.transform = `translateX(${flick.dx}px) rotate(${flick.dx * 0.045}deg)`;
    style.opacity = Math.max(0.4, 1 - Math.abs(flick.dx) / 340);
  }

  let cls =
    "relative flex min-h-[88px] w-full items-center rounded-2xl border-2 px-5 py-4 text-left text-lg font-semibold leading-snug select-none ";
  if (flyOffDir) {
    cls += flyOffDir === "left" ? "animate-wyr-fly-off-left " : "animate-wyr-fly-off-right ";
    cls += "border-slate-200 bg-white text-slate-400";
  } else if (victor) {
    cls += "animate-wyr-victor border-brand-400 bg-brand-50 text-brand-900 shadow-md";
  } else if (flick.dragging) {
    cls += flick.pastThreshold
      ? "border-slate-300 bg-slate-50 text-slate-400 shadow-xl cursor-grabbing"
      : "border-brand-300 bg-white text-slate-900 shadow-xl cursor-grabbing";
  } else {
    cls +=
      "wyr-spring-back border-slate-200 bg-white text-slate-900 cursor-grab hover:border-brand-300 hover:bg-brand-50/40";
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      {...flick.handlers}
      style={style}
      className={cls}
    >
      <span className="flex-1">{label}</span>
      {flick.dragging && flick.pastThreshold && (
        <span className="ml-3 shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
          letting this one go
        </span>
      )}
    </button>
  );
}
