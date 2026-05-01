"use client";

import { useState } from "react";
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

  async function handlePick(choice: 0 | 1) {
    if (loading) return;
    setLoading(true);
    try {
      await submitWyrChoice(data.wyrSessionId, choice);
      void haptic("tap");
      router.refresh();
      // Optimistically update local state so UI feels instant
      setData((prev) => ({ ...prev, myChoice: choice }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  const { question, state, myChoice, partnerSubmitted, partnerName, reveal } = data;

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
          const isRevealed = state === "revealed" && reveal != null;

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
          } else if (myChoice != null) {
            cardClass += isMine
              ? "border-brand-400 bg-brand-50 text-brand-900"
              : "border-slate-100 bg-white text-slate-400";
          } else {
            cardClass += "border-slate-200 bg-white text-slate-900 hover:border-brand-300 hover:bg-brand-50/40 cursor-pointer";
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={myChoice != null || loading}
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

      {myChoice != null && state === "open" && !partnerSubmitted && (
        <p className="text-center text-sm text-slate-500">
          Waiting for {partnerName ?? "them"} to pick…
        </p>
      )}

      {myChoice != null && state === "open" && partnerSubmitted && (
        <p className="text-center text-sm text-slate-500 animate-pulse">
          Both in — reveal loading…
        </p>
      )}

      {state === "revealed" && reveal && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-center space-y-1">
          {reveal.matched ? (
            <>
              <p className="text-base font-semibold text-brand-700">You&apos;re aligned on this one.</p>
              <p className="text-sm text-slate-500">Same pick — talk about why.</p>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-slate-800">You see this differently.</p>
              <p className="text-sm text-slate-500">Neither is wrong — worth a conversation.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
