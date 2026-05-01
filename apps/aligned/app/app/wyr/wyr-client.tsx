"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitWyrChoice } from "@/lib/wyr";
import type { WyrForTodayResult } from "@/lib/wyr";
import { haptic } from "@/lib/haptics";

type Props = { initialData: WyrForTodayResult; relationshipId: string };

export function WyrClient({ initialData }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [showReveal, setShowReveal] = useState(initialData.state === "revealed");
  const [animPhase, setAnimPhase] = useState<"idle" | "breathe" | "drumroll" | "slam">(
    initialData.state === "revealed" ? "slam" : "idle"
  );

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

  async function handlePick(choice: 0 | 1) {
    if (loading) return;
    setLoading(true);
    try {
      await submitWyrChoice(data.wyrSessionId, choice);
      void haptic("tap");
      router.refresh();
      setData((prev) => ({ ...prev, myChoice: choice }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  const { question, myChoice, partnerSubmitted, partnerName, reveal } = data;

  return (
    <div className="animate-calm-fade-in space-y-6">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dusk-600">
          Would You Rather
        </p>
        <p className="text-sm text-slate-500">Pick one — no right answer.</p>
      </div>

      <div className="space-y-3">
        {([question.optionA, question.optionB] as const).map((label, i) => {
          const idx = i as 0 | 1;
          const isMine = myChoice === idx;
          const isPartners = reveal?.partnerChoice === idx;
          const isRevealed = showReveal && reveal != null;

          let cardClass =
            "relative flex min-h-[88px] w-full items-center rounded-2xl border-2 px-5 py-4 text-left text-lg font-semibold leading-snug transition active:scale-[0.98] ";

          if (isRevealed) {
            cardClass += isMine && isPartners
              ? "border-brand-400 bg-brand-50 text-brand-900 animate-wyr-match-glow"
              : isMine
                ? "border-brand-300 bg-brand-50/60 text-slate-900"
                : isPartners
                  ? "border-violet-300 bg-violet-50/60 text-slate-900"
                  : "border-slate-100 bg-white text-slate-400";
            if (animPhase === "slam") cardClass += " animate-wyr-slam";
          } else if (myChoice != null) {
            cardClass += isMine
              ? "border-brand-400 bg-brand-50 text-brand-900 -translate-y-1 shadow-md"
              : "border-slate-100 bg-white text-slate-400";
            if (animPhase === "breathe") cardClass += " animate-wyr-breathe";
            if (animPhase === "drumroll") cardClass += " animate-wyr-drumroll";
          } else {
            cardClass += "border-slate-200 bg-white text-slate-900 hover:border-brand-300 hover:bg-brand-50/40 cursor-pointer";
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={myChoice != null || loading || animPhase === "drumroll"}
              onClick={() => handlePick(idx)}
              className={cardClass}
            >
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
            </button>
          );
        })}
      </div>

      {/* States */}
      {myChoice == null && (
        <p className="text-center text-sm text-slate-400">Tap to pick. Your choice stays hidden until they answer.</p>
      )}

      {myChoice != null && data.state === "open" && !partnerSubmitted && (
        <div className="rounded-2xl border border-dusk-100 bg-gradient-to-br from-dusk-50 to-white p-5 text-center">
          <p className="text-base font-semibold text-slate-900">{partnerName ?? "Them"} hasn&apos;t picked yet.</p>
          <p className="mt-1 text-sm text-slate-600">Your choice is locked in. We&apos;ll reveal the match the moment they do.</p>
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
    </div>
  );
}
