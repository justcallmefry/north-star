"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, ChevronDown, Circle, HelpCircle, Scale } from "lucide-react";
import { TodayRandomImage } from "../today-random-image";

type Props = {
  distinctImages: string[];
  quizDoneToday: boolean | null;
  agreementDoneToday: boolean | null;
};

/** Collapsible extras on Today—daily question stays the clear hero. */
export function MoreTodaySection({
  distinctImages,
  quizDoneToday,
  agreementDoneToday,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white/60 shadow-sm ring-1 ring-slate-100/80">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/80 rounded-xl"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Optional</p>
          <p className="mt-0.5 text-sm font-medium text-slate-800">More today</p>
          <p className="mt-0.5 text-xs text-slate-500">Short extras—still just you two.</p>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-200/60 bg-white/40 px-3 pb-3 pt-3 sm:px-4">
          <div className="ns-card w-full text-left !py-3 !pr-3 border-l-2 border-l-slate-300 bg-slate-50/50 shadow-none">
            <div className="flex items-center justify-between gap-2 pb-2">
              <Link href="/app/quiz" className="inline-flex items-center gap-2 hover:opacity-90 min-w-0">
                <HelpCircle className="h-4 w-4 shrink-0 text-slate-600" strokeWidth={2} />
                <span className="font-semibold text-slate-900 truncate text-sm">Guess &amp; compare</span>
              </Link>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/90" aria-hidden>
                {quizDoneToday === true ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600" strokeWidth={2} aria-label="Done today" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-400" strokeWidth={2} aria-label="Not done today" />
                )}
              </span>
            </div>
            <div className="grid grid-cols-[auto,1fr] gap-2 items-center">
              <TodayRandomImage src={distinctImages[0]} className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg shrink-0" sizes="80px" />
              <p className="text-xs text-slate-600 leading-snug min-w-0">
                Quick choices—then see how well you read each other.
              </p>
            </div>
            <Link href="/app/quiz" className="ns-btn-secondary block w-full text-center py-2 text-xs mt-2 !ring-1 !ring-slate-200">
              {quizDoneToday === true ? "View results" : "Start"}
            </Link>
          </div>

          <div className="ns-card w-full text-left !py-3 !pr-3 border-l-2 border-l-slate-300 bg-slate-50/50 shadow-none">
            <div className="flex items-center justify-between gap-2 pb-2">
              <Link href="/app/agreement" className="inline-flex items-center gap-2 hover:opacity-90 min-w-0">
                <Scale className="h-4 w-4 shrink-0 text-slate-600" strokeWidth={2} />
                <span className="font-semibold text-slate-900 truncate text-sm">Same page?</span>
              </Link>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/90" aria-hidden>
                {agreementDoneToday === true ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600" strokeWidth={2} aria-label="Done today" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-400" strokeWidth={2} aria-label="Not done today" />
                )}
              </span>
            </div>
            <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
              <p className="text-xs text-slate-600 leading-snug min-w-0">
                Rate a few statements—then compare. No right answers.
              </p>
              <TodayRandomImage src={distinctImages[1]} className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg shrink-0" sizes="80px" />
            </div>
            <Link href="/app/agreement" className="ns-btn-secondary block w-full text-center py-2 text-xs mt-2 !ring-1 !ring-slate-200">
              {agreementDoneToday === true ? "View results" : "Start"}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
