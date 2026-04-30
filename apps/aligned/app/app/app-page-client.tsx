"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Circle, HelpCircle, Scale } from "lucide-react";
import { EmptyTogetherIllustration } from "@/components/illustrations";
import { getQuizForToday } from "@/lib/quiz";
import { getAgreementForToday } from "@/lib/agreement";
import { TodaySection } from "./today-section";
import { AnniversaryBanner } from "./anniversary-banner";

export type Relationship = {
  id: string;
  name: string | null;
  status: string;
  anniversaryISO?: string | null;
};
export type AppPageInitialData = {
  session: { user: { id: string; email?: string | null; name?: string | null; image?: string | null } };
  relationships: Relationship[];
  /** Two today-image paths for the daily checklist (Quiz, Alignment). */
  todayImagePaths: string[];
};

function getLocalDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Props = { initialData: AppPageInitialData };

export function AppPageClient({ initialData }: Props) {
  const { relationships } = initialData;
  const relationshipId = relationships[0]?.id ?? null;

  // Set only on client so we use the user's calendar day, not the server's (same fix as TodaySection).
  const [localDateStr, setLocalDateStr] = useState<string | null>(null);
  const [quizDoneToday, setQuizDoneToday] = useState<boolean | null>(null);
  const [agreementDoneToday, setAgreementDoneToday] = useState<boolean | null>(null);

  useEffect(() => {
    setLocalDateStr(getLocalDateString());
  }, []);

  useEffect(() => {
    if (!relationshipId || localDateStr == null) return;
    let cancelled = false;
    Promise.all([
      getQuizForToday(relationshipId, localDateStr),
      getAgreementForToday(relationshipId, localDateStr),
    ]).then(([quiz, agreement]) => {
      if (cancelled) return;
      setQuizDoneToday(quiz?.myParticipation != null);
      setAgreementDoneToday(agreement?.myParticipation != null);
    });
    return () => {
      cancelled = true;
    };
  }, [relationshipId, localDateStr]);

  return (
    <main className="flex flex-col gap-2">
      {relationships.length > 0 ? (
        <div className="ns-stack animate-fade-in-ease">
          <AnniversaryBanner
            anniversaryISO={relationships[0]?.anniversaryISO ?? null}
          />
          <TodaySection relationshipId={relationshipId!} />

          <section className="space-y-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
              Also today
            </p>

            {/* Quiz row — compact, doesn't compete with the prompt above */}
            <Link
              href="/app/quiz"
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition active:scale-[0.99] hover:border-dusk-300/70"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dusk-50 text-dusk-600">
                <HelpCircle className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">Quiz</p>
                <p className="truncate text-sm text-slate-500">
                  Guess what your partner picked.
                </p>
              </div>
              {quizDoneToday === true ? (
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} aria-label="Done today" />
              ) : (
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              )}
            </Link>

            {/* Alignment row — same compact style */}
            <Link
              href="/app/agreement"
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition active:scale-[0.99] hover:border-dusk-300/70"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dusk-50 text-dusk-600">
                <Scale className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">Alignment</p>
                <p className="truncate text-sm text-slate-500">
                  Rate, then guess how they&apos;d answer.
                </p>
              </div>
              {agreementDoneToday === true ? (
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} aria-label="Done today" />
              ) : (
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              )}
            </Link>
          </section>
        </div>
      ) : (
        <section className="mt-4 flex flex-1 items-center justify-center">
          <div className="ns-card max-w-md text-center">
            <div className="flex justify-center">
              <EmptyTogetherIllustration className="w-28 h-28 sm:w-32 sm:h-32" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500 sm:text-sm">
              Welcome
            </p>
            <p className="mt-3 text-xl font-semibold text-slate-900 sm:text-2xl">
              Create or join
            </p>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Create or join to get your first question. Invite your partner when you&apos;re ready.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              One question a day—the most valuable screen time you&apos;ll do together.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Calm, private, no feed. Just you two.
            </p>
            <div className="mt-5 w-full">
              <Link href="/app/pair" className="ns-btn-primary flex w-full justify-center items-center gap-2 py-3.5" prefetch={false}>
                <ArrowRight className="h-4 w-4" />
                Pair with partner
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
