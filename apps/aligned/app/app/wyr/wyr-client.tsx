"use client";

import { useState } from "react";
import { Shuffle } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { RevealStamp } from "@/components/reveal-stamp";
import { useFirstReveal } from "@/lib/use-first-reveal";

// ─── Data shape ───────────────────────────────────────────────────────────────

export type WyrQuestion = {
  optionA: string;
  optionB: string;
};

/**
 * Possible states:
 *   "no_session"  — no WYR session for today yet (or neither partner has answered)
 *   "waiting"     — current user answered, waiting for partner
 *   "revealed"    — both answered, show results
 */
export type WyrForTodayResult =
  | { state: "no_session"; question: WyrQuestion }
  | {
      state: "waiting";
      question: WyrQuestion;
      myChoice: 0 | 1;
      partnerName: string | null;
    }
  | {
      state: "revealed";
      question: WyrQuestion;
      myChoice: 0 | 1;
      partnerChoice: 0 | 1;
      matched: boolean;
      myName: string | null;
      myImage: string | null;
      partnerName: string | null;
      partnerImage: string | null;
      /** Stable key for first-reveal "Revealed!" stamp. */
      revealKey: string;
    };

// ─── Server-action stub (filled in by the page) ───────────────────────────────

type SubmitWyrAction = (choice: 0 | 1) => Promise<{ ok: boolean; error?: string }>;

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  initialData: WyrForTodayResult;
  submitChoice: SubmitWyrAction;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function WyrClient({ initialData, submitChoice }: Props) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(choice: 0 | 1) {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await submitChoice(choice);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      // Optimistically transition to "waiting" state so the UI responds immediately.
      // The parent/server will push the real update (e.g. both answered) on next render.
      if (data.state === "no_session") {
        setData({
          state: "waiting",
          question: data.question,
          myChoice: choice,
          partnerName: null,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  // ── Revealed state ────────────────────────────────────────────────────────
  if (data.state === "revealed") {
    return (
      <WyrRevealView data={data} />
    );
  }

  // ── Waiting state ─────────────────────────────────────────────────────────
  if (data.state === "waiting") {
    const optionLabel = data.myChoice === 0 ? data.question.optionA : data.question.optionB;
    const partnerLabel = data.partnerName ?? "your partner";
    return (
      <div className="space-y-6">
        <WyrPageHeader />
        <div className="ns-card space-y-4 py-8 text-center">
          <p className="text-lg font-medium text-slate-700">
            You picked <span className="font-semibold text-peach-600">{optionLabel}</span>
          </p>
          <p className="text-sm text-slate-500">
            Waiting for {partnerLabel} to answer…
          </p>
          <div className="flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        </div>
      </div>
    );
  }

  // ── No session / picking state ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <WyrPageHeader />
      <div className="ns-card space-y-5 py-6">
        <p className="text-xl font-bold leading-snug text-slate-900 text-center sm:text-2xl">
          Would You Rather…
        </p>
        <div className="flex flex-col gap-3">
          <ChoiceButton
            label={data.question.optionA}
            loading={loading}
            onClick={() => handlePick(0)}
          />
          <div className="flex items-center justify-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-slate-400">or</span>
          </div>
          <ChoiceButton
            label={data.question.optionB}
            loading={loading}
            onClick={() => handlePick(1)}
          />
        </div>
        {error && (
          <p className="mt-2 text-center text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Choice button ────────────────────────────────────────────────────────────

function ChoiceButton({
  label,
  loading,
  onClick,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full rounded-xl border-2 border-peach-300 bg-white px-5 py-5 text-center text-lg font-semibold text-slate-800 shadow-sm transition hover:border-peach-400 hover:bg-peach-50 active:scale-[0.98] disabled:opacity-50 sm:text-xl"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <LoadingSpinner size="sm" />
          Submitting…
        </span>
      ) : (
        label
      )}
    </button>
  );
}

// ─── Page header ──────────────────────────────────────────────────────────────

function WyrPageHeader() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-peach-400 to-peach-500 text-white shadow-lg shadow-peach-300/60 ring-2 ring-white ring-offset-2">
        <Shuffle className="h-7 w-7" strokeWidth={2} />
      </div>
      <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
        Would You Rather
      </h1>
      <p className="mt-1 max-w-md text-sm text-slate-600 sm:text-base">
        Pick one — see if you and your partner think alike.
      </p>
    </div>
  );
}

// ─── Avatar helper ────────────────────────────────────────────────────────────

function Avatar({ imageUrl, fallback }: { imageUrl: string | null; fallback: string }) {
  const isUrl = typeof imageUrl === "string" && imageUrl.trim().startsWith("http");
  if (isUrl) {
    return (
      <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-2 ring-white">
        <img
          src={imageUrl!.trim()}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          width={40}
          height={40}
        />
      </span>
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-2xl ring-2 ring-white" aria-hidden>
      {fallback}
    </span>
  );
}

// ─── Reveal view ──────────────────────────────────────────────────────────────

function WyrRevealView({
  data,
}: {
  data: Extract<WyrForTodayResult, { state: "revealed" }>;
}) {
  const isFirstReveal = useFirstReveal(data.revealKey, true);
  const cascade = isFirstReveal ? "animate-reveal-cascade" : "";

  const myName = data.myName ?? "You";
  const partnerName = data.partnerName ?? "Partner";
  const myLabel = data.myChoice === 0 ? data.question.optionA : data.question.optionB;
  const partnerLabel = data.partnerChoice === 0 ? data.question.optionA : data.question.optionB;

  return (
    <div className="space-y-5">
      {isFirstReveal && <RevealStamp totalMembers={2} />}

      <p
        className={`text-center text-lg font-medium text-slate-700 sm:text-xl ${cascade} ${cascade ? "reveal-cascade-delay-1" : ""}`}
      >
        {data.matched
          ? "You both picked the same thing!"
          : "You went different ways — interesting!"}
      </p>

      {/* ── Matched: two stacked choice cards with SVG connect line ── */}
      {data.matched ? (
        <div
          className={`relative ${cascade} ${cascade ? "reveal-cascade-delay-2" : ""}`}
        >
          {/*
            SVG overlay: draws a vertical line between the two avatar anchor
            points. The avatar dots sit at y≈20% (top card center) and y≈80%
            (bottom card center). x=50% centers on the stack. The line uses
            stroke-dashoffset animation defined in globals.css.
          */}
          <svg
            className="pointer-events-none absolute inset-0 z-10 h-full w-full"
            preserveAspectRatio="none"
            aria-hidden
          >
            <line
              x1="50%"
              y1="20%"
              x2="50%"
              y2="80%"
              stroke="#E07A5F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="200"
              strokeDashoffset="200"
              className="animate-wyr-connect"
            />
            <circle
              cx="50%"
              cy="20%"
              r="4"
              fill="#E07A5F"
              className="animate-wyr-dot-1"
              style={{ opacity: 0 }}
            />
            <circle
              cx="50%"
              cy="80%"
              r="4"
              fill="#E07A5F"
              className="animate-wyr-dot-2"
              style={{ opacity: 0 }}
            />
          </svg>

          {/* Top card — current user */}
          <div className="ns-card mb-3 flex flex-col items-center gap-3 bg-gradient-to-br from-emerald-50 to-white py-6 ring-1 ring-emerald-200">
            <Avatar imageUrl={data.myImage} fallback="⭐" />
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{myName}</p>
            <p className="rounded-xl border-2 border-peach-300 bg-white px-4 py-3 text-center text-lg font-semibold text-slate-800 shadow-sm sm:text-xl">
              {myLabel}
            </p>
          </div>

          {/* Bottom card — partner */}
          <div className="ns-card flex flex-col items-center gap-3 bg-gradient-to-br from-emerald-50 to-white py-6 ring-1 ring-emerald-200">
            <Avatar imageUrl={data.partnerImage} fallback="🌟" />
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{partnerName}</p>
            <p className="rounded-xl border-2 border-peach-300 bg-white px-4 py-3 text-center text-lg font-semibold text-slate-800 shadow-sm sm:text-xl">
              {partnerLabel}
            </p>
          </div>
        </div>
      ) : (
        /* ── Mismatch: side-by-side cards, no SVG line ── */
        <div
          className={`grid grid-cols-2 gap-4 ${cascade} ${cascade ? "reveal-cascade-delay-2" : ""}`}
        >
          <div className="ns-card flex flex-col items-center gap-3 bg-gradient-to-br from-amber-50 to-white py-6 ring-1 ring-amber-200">
            <Avatar imageUrl={data.myImage} fallback="⭐" />
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{myName}</p>
            <p className="rounded-xl border-2 border-amber-300 bg-white px-3 py-3 text-center text-base font-semibold text-slate-800 shadow-sm sm:text-lg">
              {myLabel}
            </p>
          </div>
          <div className="ns-card flex flex-col items-center gap-3 bg-gradient-to-br from-amber-50 to-white py-6 ring-1 ring-amber-200">
            <Avatar imageUrl={data.partnerImage} fallback="🌟" />
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{partnerName}</p>
            <p className="rounded-xl border-2 border-amber-300 bg-white px-3 py-3 text-center text-base font-semibold text-slate-800 shadow-sm sm:text-lg">
              {partnerLabel}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
