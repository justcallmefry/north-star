"use client";

import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { getMilestonePrompt, type MilestoneContext } from "@/lib/milestones";
import { haptic } from "@/lib/haptics";

type Props = {
  relationshipId: string;
  context: MilestoneContext;
  /** Label shown above the prompt — e.g. "Happy 2-year anniversary" */
  eyebrow: string;
};

function dismissKey(relationshipId: string, context: MilestoneContext) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `ns:milestone-dismissed:${relationshipId}:${context}:${y}-${m}-${d}`;
}

export function MilestonePromptCard({ relationshipId, context, eyebrow }: Props) {
  const [prompt, setPrompt] = useState<{ id: string; text: string; momentText: string | null } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = dismissKey(relationshipId, context);
      if (sessionStorage.getItem(key)) {
        setDismissed(true);
        setLoading(false);
        return;
      }
    }
    getMilestonePrompt(relationshipId, context)
      .then((p) => setPrompt(p))
      .finally(() => setLoading(false));
  }, [relationshipId, context]);

  function handleDismiss() {
    const key = dismissKey(relationshipId, context);
    sessionStorage.setItem(key, "1");
    setDismissed(true);
    void haptic("tap");
  }

  if (loading || dismissed || !prompt) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-peach-300/40 bg-gradient-to-br from-peach-50 via-white to-dusk-50/40 px-5 py-5 shadow-sm sm:px-6">
      {/* Dismiss */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Eyebrow */}
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-peach-500" aria-hidden />
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-peach-600">
          {eyebrow}
        </p>
      </div>

      {/* Label */}
      <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
        A question for today
      </p>

      {/* The prompt */}
      <p className="mt-2 font-display text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
        {prompt.text}
      </p>

      {prompt.momentText && (
        <p className="mt-2 text-sm italic text-slate-500">{prompt.momentText}</p>
      )}

      {/* Framing note */}
      <p className="mt-3 text-sm text-slate-500">
        Discuss this together — out loud, or write your answers before you share.
      </p>
    </div>
  );
}
