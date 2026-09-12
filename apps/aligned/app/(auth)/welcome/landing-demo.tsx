"use client";

import { useState } from "react";

/**
 * The reveal mechanic, playable before anyone signs up.
 *
 * The audit's central finding was that the front door explained the product
 * instead of demonstrating it. You cannot describe "answering in secret" in
 * a way that lands; you have to let someone feel the moment their answer
 * seals and someone else's opens. So: type an answer, watch it seal, read
 * what "Jordan" wrote.
 *
 * Entirely client-side and content is fixed — no DB call, so the landing
 * page can never fail to render.
 */

const QUESTION = "What's something I did this week that you didn't say thank you for?";
const PARTNER_NAME = "Jordan";
const PARTNER_ANSWER =
  "You drove to the pharmacy at midnight and never once made it a thing. I fell asleep before I could say it.";

/** Words worth highlighting if the visitor happens to use one too. */
const SHARED_CANDIDATES = [
  "drove", "driving", "drive", "midnight", "late", "night", "tired",
  "quiet", "coffee", "morning", "thank", "noticed", "listened",
];

type Phase = "writing" | "sealing" | "revealed";

export function LandingDemo() {
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<Phase>("writing");

  const trimmed = answer.trim();
  const canSeal = trimmed.length >= 3;

  function seal() {
    if (!canSeal) return;
    setPhase("sealing");
    window.setTimeout(() => setPhase("revealed"), 1250);
  }

  // Any word the visitor shares with the partner's answer, the way
  // detectAligned() works in the app — minus the stopword list, since this
  // is a demo rather than the real matcher.
  const visitorWords = new Set(
    trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3)
  );
  const shared = SHARED_CANDIDATES.filter(
    (w) => visitorWords.has(w) && PARTNER_ANSWER.toLowerCase().includes(w)
  );

  function highlight(text: string) {
    if (shared.length === 0) return text;
    const pattern = new RegExp(`\\b(${shared.join("|")})\\b`, "gi");
    return text.split(pattern).map((part, i) =>
      shared.some((w) => w.toLowerCase() === part.toLowerCase()) ? (
        <mark key={i} className="rounded-md bg-peach-300 px-1.5 py-0.5 text-[#5a2f1e]">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-[28px] border border-cream-200 bg-[#FFFDF8] p-6 shadow-[0_18px_50px_-12px_rgba(43,38,32,0.18)] sm:p-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-peach-600">
          Tonight&rsquo;s question
        </p>
        <p className="mt-3 font-prompt text-[21px] leading-snug text-[#2b2620] sm:text-[23px]">
          {QUESTION}
        </p>

        {phase === "writing" && (
          <div className="mt-5">
            <label htmlFor="demo-answer" className="sr-only">
              Your answer
            </label>
            <textarea
              id="demo-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={3}
              placeholder="Write anything. Nobody sees this but you."
              className="w-full resize-none rounded-2xl border border-cream-200 bg-cream-50 p-4 font-prompt text-[16px] leading-relaxed text-[#3a332b] outline-none placeholder:font-sans placeholder:text-[14px] placeholder:text-slate-400 focus:border-peach-400 focus:ring-2 focus:ring-peach-300/50"
            />
            <button
              type="button"
              onClick={seal}
              disabled={!canSeal}
              className="mt-3 w-full rounded-full bg-dusk-500 px-5 py-3.5 text-[15px] font-semibold text-cream-50 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Seal my answer
            </button>
            <p className="mt-2.5 text-center text-[12.5px] text-slate-500">
              Nothing is saved. This is just so you can feel how it works.
            </p>
          </div>
        )}

        {phase === "sealing" && (
          <div className="mt-6 flex flex-col items-center py-7" aria-live="polite">
            <div className="h-14 w-14 animate-pulse rounded-full bg-gradient-to-br from-peach-400 to-peach-600 shadow-inner" />
            <p className="mt-4 font-prompt text-[17px] text-[#2b2620]">Sealed.</p>
            <p className="mt-1 text-[13px] text-slate-500">Opening {PARTNER_NAME}&rsquo;s answer&hellip;</p>
          </div>
        )}

        {phase === "revealed" && (
          <div className="mt-5 space-y-3" aria-live="polite">
            <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-500">You</p>
              <p className="mt-2 font-prompt text-[16px] leading-relaxed text-[#3a332b]">
                {highlight(trimmed)}
              </p>
            </div>
            <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-500">
                {PARTNER_NAME}
              </p>
              <p className="mt-2 font-prompt text-[16px] leading-relaxed text-[#3a332b]">
                {highlight(PARTNER_ANSWER)}
              </p>
            </div>

            {shared.length > 0 ? (
              <p className="pt-1 text-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-peach-300 px-4 py-2 text-[13px] font-bold tracking-wide text-[#5a2f1e]">
                  ✨ aligned
                </span>
                <span className="mt-2 block text-[12.5px] text-slate-500">
                  You both said &ldquo;{shared[0]}&rdquo; without knowing.
                </span>
              </p>
            ) : (
              <p className="pt-1 text-center text-[13px] text-slate-500">
                That&rsquo;s the moment. Every night, with the person you actually live it with.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setAnswer("");
                setPhase("writing");
              }}
              className="w-full pt-1 text-center text-[13px] font-medium text-peach-600 underline underline-offset-4"
            >
              Try another answer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
