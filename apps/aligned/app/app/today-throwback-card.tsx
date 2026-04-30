// apps/aligned/app/app/today-throwback-card.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { COPY } from "@/lib/copy";
import { createOrGetTodaySession } from "@/lib/sessions";
import { haptic } from "@/lib/haptics";
import type { ThrowbackTodayResult } from "@/lib/sessions";

type Props = {
  throwback: ThrowbackTodayResult;
  localDateStr: string;
};

function getDayTheme() {
  // Saturday — reuse the peach palette from lib/day-theme.
  return {
    sectionClass:
      "relative animate-calm-fade-in rounded-2xl border border-peach-300/40 bg-gradient-to-br from-peach-300/20 via-white to-white p-5 shadow-sm sm:p-6",
    eyebrowChipClass: "inline-flex items-center gap-2 rounded-lg bg-peach-300/30 px-3 py-1",
    eyebrowDotClass: "h-1.5 w-1.5 rounded-full bg-peach-500",
    eyebrowTextClass:
      "text-xs font-semibold uppercase tracking-[0.18em] text-peach-600 sm:text-sm",
  };
}

export function TodayThrowbackCard({ throwback, localDateStr }: Props) {
  const theme = getDayTheme();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAnswerAgain() {
    if (!throwback.promptId) {
      toast.error("That memory is no longer linked.");
      return;
    }
    setError(null);
    void haptic("tap");
    startTransition(async () => {
      try {
        const { sessionId } = await createOrGetTodaySession(
          throwback.relationshipId,
          localDateStr,
          throwback.promptId!
        );
        router.push(`/app/session/${sessionId}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : COPY.errors.submit;
        setError(msg);
        toast.error(msg);
      }
    });
  }

  return (
    <section className={theme.sectionClass}>
      <div className={theme.eyebrowChipClass}>
        <span className={theme.eyebrowDotClass} />
        <h2 className={theme.eyebrowTextClass}>{COPY.throwback.eyebrow}</h2>
      </div>
      <p className="mt-3 text-sm text-slate-600 sm:text-base">
        {COPY.throwback.ageLine(throwback.monthsAgo)}
      </p>
      <p className="mt-1 text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
        {throwback.promptText}
      </p>
      <div className="mt-4 space-y-2">
        {throwback.responses.map((r) => (
          <div
            key={r.userId}
            className="rounded-xl border border-peach-200/60 bg-white px-3.5 py-2.5"
          >
            <p className="text-xs font-semibold text-peach-700">
              {r.name ?? "They"} said:
            </p>
            <p className="mt-0.5 text-sm text-slate-700 sm:text-base">
              {r.content ?? "(no answer saved)"}
            </p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleAnswerAgain}
        disabled={pending || !throwback.promptId}
        className="mt-5 ns-btn-primary block w-full text-center py-3.5 transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Opening…" : COPY.throwback.action}
      </button>
      {error && (
        <p className="mt-2 text-xs text-rose-600" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
