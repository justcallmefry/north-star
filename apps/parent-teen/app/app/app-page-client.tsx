"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle, Circle, HelpCircle, History, Scale } from "lucide-react";
import { EmptyTogetherIllustration } from "@/components/illustrations";
import { getQuizForToday } from "@/lib/quiz";
import { getAgreementForToday } from "@/lib/agreement";
import { TodaySection } from "./today-section";
import { TodayRandomImage } from "./today-random-image";

export type Relationship = { id: string; name: string | null; status: string };
export type AppPageInitialData = {
  session: { user: { id: string; email?: string | null; name?: string | null; image?: string | null } };
  relationships: Relationship[];
  /** Which relationship the user is currently viewing (for dual-parent switcher). */
  currentRelationshipId: string | null;
  /** Four today-image paths chosen on the server (deterministic by date) to avoid hydration mismatch. */
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
  const { session, relationships, currentRelationshipId, todayImagePaths } = initialData;
  const relationshipId = currentRelationshipId ?? relationships[0]?.id ?? null;
  const displayName = session.user.name ?? session.user.email ?? "";
  const distinctImages = todayImagePaths;

  const [localDateStr] = useState(getLocalDateString);
  const [quizDoneToday, setQuizDoneToday] = useState<boolean | null>(null);
  const [agreementDoneToday, setAgreementDoneToday] = useState<boolean | null>(null);

  useEffect(() => {
    if (!relationshipId) return;
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
      <header className="flex shrink-0 items-center justify-between gap-4 py-1">
        <p className="text-base text-slate-600 sm:text-lg min-w-0 flex-1">
          <span className="block">One question a day.</span>
          <span className="block">Answer together.</span>
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden flex-col items-end text-xs text-slate-400 sm:flex">
            <span className="flex items-center gap-2">
              {session.user.image && (session.user.image.startsWith("http://") || session.user.image.startsWith("https://")) ? (
                <span className="relative block h-6 w-6 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-200">
                  <Image
                    src={session.user.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="24px"
                    unoptimized={session.user.image.includes("blob.vercel-storage.com")}
                  />
                </span>
              ) : null}
              <span className="text-slate-500">Signed in as</span>
            </span>
            <span className="mt-0.5 max-w-[180px] truncate text-sm font-medium text-slate-600">
              {displayName}
            </span>
          </div>
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-50/80 ring-1 ring-brand-200/80 sm:h-24 sm:w-24" aria-hidden>
            <Image
              src="/aligned-icon.png"
              alt=""
              fill
              className="object-contain"
              sizes="(max-width: 640px) 80px, 96px"
            />
          </div>
        </div>
      </header>

      {relationships.length > 0 ? (
        <div className="ns-stack animate-fade-in-ease">
          <section className="space-y-2">
            <div className="flex justify-end">
              <Link
                href="/app/history"
                className="ns-btn-secondary hidden sm:inline-flex"
              >
                <History className="h-3.5 w-3.5" />
                History
              </Link>
            </div>

            <TodaySection relationshipId={relationshipId!} />

            <section className="space-y-4">
              <div className="space-y-3">
                {/* Quiz card: checklist-style with done state */}
                <div className="ns-card w-full text-left !py-3 !pr-3 border-l-4 border-l-brand-500 bg-brand-50/30">
                  <div className="flex items-center justify-between gap-2 pb-2">
                    <Link href="/app/quiz" className="inline-flex items-center gap-2 hover:opacity-90 min-w-0">
                      <HelpCircle className="h-4 w-4 shrink-0 text-brand-600" strokeWidth={2} />
                      <span className="font-semibold text-slate-900 truncate">Quiz</span>
                    </Link>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90" aria-hidden>
                      {quizDoneToday === true ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" strokeWidth={2} />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-400" strokeWidth={2} />
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-[auto,1fr] gap-3 items-center">
                    <TodayRandomImage src={distinctImages[0]} className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg shrink-0" sizes="96px" />
                    <p className="text-sm text-slate-500 leading-snug min-w-0">
                      Answer for yourself, then guess what your partner picked.
                    </p>
                  </div>
                  <Link
                    href="/app/quiz"
                    className="ns-btn-primary block w-full text-center py-2.5 text-sm mt-3"
                  >
                    {quizDoneToday === true ? "View Results" : "Take Quiz"}
                  </Link>
                </div>

                {/* Alignment card: checklist-style with done state */}
                <div className="ns-card w-full text-left !py-3 !pr-3 border-l-4 border-l-brand-500 bg-brand-50/30">
                  <div className="flex items-center justify-between gap-2 pb-2">
                    <Link href="/app/agreement" className="inline-flex items-center gap-2 hover:opacity-90 min-w-0">
                      <Scale className="h-4 w-4 shrink-0 text-brand-600" strokeWidth={2} />
                      <span className="font-semibold text-slate-900 truncate">Alignment</span>
                    </Link>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90" aria-hidden>
                      {agreementDoneToday === true ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" strokeWidth={2} />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-400" strokeWidth={2} />
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-[1fr,auto] gap-3 items-center">
                    <p className="text-sm text-slate-500 leading-snug min-w-0">
                      Rate each statement, then guess how your partner would answer.
                    </p>
                    <TodayRandomImage src={distinctImages[1]} className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg shrink-0" sizes="96px" />
                  </div>
                  <Link
                    href="/app/agreement"
                    className="ns-btn-primary block w-full text-center py-2.5 text-sm mt-3"
                  >
                    {agreementDoneToday === true ? "View Results" : "Take Alignment"}
                  </Link>
                </div>
              </div>
            </section>
          </section>
        </div>
      ) : (
        <section className="mt-4 flex flex-1 items-center justify-center">
          <div className="ns-card max-w-md text-center">
            <div className="flex justify-center">
              <EmptyTogetherIllustration className="w-28 h-28 sm:w-32 sm:h-32" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-familyGreen-600 sm:text-sm">
              Welcome
            </p>
            <p className="mt-3 text-xl font-semibold text-slate-900 sm:text-2xl">
              Create or join
            </p>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Create or join to get your first question. Invite your partner or child when you&apos;re ready.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              One question a day—the most valuable screen time you&apos;ll do together.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Calm, private, no feed. Just you two.
            </p>
            <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/app/pair" className="ns-btn-primary" prefetch={false}>
                <ArrowRight className="h-4 w-4" />
                Pair up with your partner or child
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
