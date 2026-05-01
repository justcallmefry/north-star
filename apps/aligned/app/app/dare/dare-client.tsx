"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, Flame } from "lucide-react";
import { toast } from "sonner";
import { acceptDare, completeDare } from "@/lib/dare";
import type { DareForWeekResult } from "@/lib/dare";
import { haptic } from "@/lib/haptics";

type Props = { dare: DareForWeekResult };

export function DareClient({ dare: initial }: Props) {
  const router = useRouter();
  const [dare, setDare] = useState(initial);
  const [loading, setLoading] = useState<"accept" | "complete" | null>(null);

  async function handleAccept() {
    setLoading("accept");
    try {
      await acceptDare(dare.dareId);
      void haptic("tap");
      setDare((d) => ({ ...d, accepted: true }));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleComplete() {
    setLoading("complete");
    try {
      await completeDare(dare.dareId);
      void haptic("success");
      setDare((d) => ({ ...d, accepted: true, completed: true }));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="animate-calm-fade-in space-y-6">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dusk-600">
          This Week&apos;s Dare
        </p>
        <p className="text-sm text-slate-500">Get out of your routine. Do it together.</p>
      </div>

      <div className={`rounded-2xl border p-6 space-y-4 shadow-sm ${
        dare.completed
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
          : dare.accepted
            ? "border-brand-200 bg-gradient-to-br from-brand-50/80 to-white"
            : "border-slate-200 bg-white"
      }`}>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
            {dare.dare.title}
          </h2>
          {dare.completed && (
            <CheckCircle className="h-6 w-6 shrink-0 text-emerald-600 mt-0.5" strokeWidth={2} />
          )}
        </div>

        <p className="text-base leading-relaxed text-slate-600">{dare.dare.description}</p>

        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <Clock className="h-4 w-4" strokeWidth={2} />
          <span>{dare.dare.duration}</span>
        </div>
      </div>

      {dare.completed ? (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 px-5 py-6 text-center space-y-2 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle className="h-8 w-8" strokeWidth={2} />
          </div>
          <p className="text-xl font-bold text-emerald-800">You did it together.</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            That&apos;s what makes it count — doing it as a team. New dare arrives Monday.
          </p>
        </div>
      ) : dare.accepted ? (
        <div className="space-y-3">
          <p className="text-center text-sm text-brand-700 font-medium">
            You&apos;re committed. Come back and mark it done when you finish.
          </p>
          <button
            type="button"
            onClick={handleComplete}
            disabled={!!loading}
            className="ns-btn-primary w-full py-3.5 flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-5 w-5" strokeWidth={2} />
            {loading === "complete" ? "Saving…" : "We did it"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={!!loading}
            className="ns-btn-primary w-full py-3.5 flex items-center justify-center gap-2"
          >
            <Flame className="h-5 w-5" strokeWidth={2} />
            {loading === "accept" ? "Saving…" : "We're in — let's do it"}
          </button>
          <p className="text-center text-xs text-slate-400">
            New dare every Monday. You can still mark it done anytime this week.
          </p>
        </div>
      )}
    </div>
  );
}
