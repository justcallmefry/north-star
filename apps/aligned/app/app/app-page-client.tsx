"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyTogetherIllustration } from "@/components/illustrations";
import { getQuizForToday } from "@/lib/quiz";
import { getAgreementForToday } from "@/lib/agreement";
import { TodaySection } from "./today-section";
import { MoreTodaySection } from "./components/more-today-section";

export type Relationship = { id: string; name: string | null; status: string };
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
  const { relationships, todayImagePaths } = initialData;
  const relationshipId = relationships[0]?.id ?? null;
  const distinctImages = todayImagePaths;

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
          <TodaySection relationshipId={relationshipId!} />

          <MoreTodaySection
            distinctImages={distinctImages}
            quizDoneToday={quizDoneToday}
            agreementDoneToday={agreementDoneToday}
          />
        </div>
      ) : (
        <section className="mt-4 flex flex-1 items-center justify-center">
          <div className="ns-card max-w-md text-center">
            <div className="flex justify-center">
              <EmptyTogetherIllustration className="w-28 h-28 sm:w-32 sm:h-32" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500 sm:text-sm">
              Almost there
            </p>
            <p className="mt-3 text-xl font-semibold text-slate-900 sm:text-2xl">
              Pair to unlock today&apos;s question
            </p>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              One of you creates a space; the other joins with a link or code. Then your private answers unlock together.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Same question. Two hidden replies—until you&apos;re both ready.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              No feed. About three minutes. Just you two.
            </p>
            <div className="mt-5 w-full">
              <Link href="/app/pair" className="ns-btn-primary flex w-full justify-center items-center gap-2 py-3.5" prefetch={false}>
                <ArrowRight className="h-4 w-4" />
                Invite or join partner
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
