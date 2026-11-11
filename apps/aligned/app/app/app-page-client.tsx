"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarRange, CheckCircle, Circle, Flame, Heart, HelpCircle, Scale, Shuffle, Sparkles } from "lucide-react";
import { EmptyTogetherIllustration } from "@/components/illustrations";
import { getQuizForToday } from "@/lib/quiz";
import { getAgreementForToday } from "@/lib/agreement";
import { getAppreciationStatus } from "@/lib/appreciation";
import type { AppreciationStatus } from "@/lib/appreciation";
import { getWyrForToday } from "@/lib/wyr";
import type { WyrForTodayResult } from "@/lib/wyr";
import { getSpotlightStatus } from "@/lib/spotlight";
import type { SpotlightStatus } from "@/lib/spotlight";
import { getDareForWeek } from "@/lib/dare";
import type { DareForWeekResult } from "@/lib/dare";
import { getDayTheme } from "@/lib/day-theme";
import { TodaySection } from "./today-section";
import { AnniversaryBanner, isAnniversaryToday } from "./anniversary-banner";
import { MilestonePromptCard } from "./milestone-prompt-card";
import { IssuePromo } from "@/components/issues/issue-promo";
import { RecapPromo } from "./recap-promo";
import { QuestCard } from "./quest-card";
import { PushPrompt } from "./push-prompt";

function RowShell({
  href,
  featured,
  children,
}: {
  href: string;
  featured: boolean;
  children: React.ReactNode;
}) {
  const base =
    "flex items-center gap-3 rounded-2xl border bg-[#FFFDF8] transition active:scale-[0.99]";
  const cls = featured
    ? `${base} border-dusk-300 px-5 py-4 shadow-md ring-1 ring-dusk-100`
    : `${base} border-[#EDE5D4] px-4 py-3 hover:border-dusk-300/70`;
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

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
  const [appreciationStatus, setAppreciationStatus] = useState<AppreciationStatus | null>(null);
  const [wyrData, setWyrData] = useState<WyrForTodayResult | null>(null);
  const [spotlightStatus, setSpotlightStatus] = useState<SpotlightStatus | null>(null);
  const [dareData, setDareData] = useState<DareForWeekResult | null>(null);

  useEffect(() => {
    setLocalDateStr(getLocalDateString());
  }, []);

  useEffect(() => {
    if (!relationshipId || localDateStr == null) return;
    let cancelled = false;
    Promise.allSettled([
      getQuizForToday(relationshipId, localDateStr),
      getAgreementForToday(relationshipId, localDateStr),
      getAppreciationStatus(relationshipId),
      getWyrForToday(relationshipId, localDateStr),
      getSpotlightStatus(relationshipId),
      getDareForWeek(relationshipId),
    ]).then(([quiz, agreement, appreciation, wyr, spotlight, dare]) => {
      if (cancelled) return;
      if (quiz.status === "fulfilled") setQuizDoneToday(quiz.value?.myParticipation != null);
      if (agreement.status === "fulfilled") setAgreementDoneToday(agreement.value?.myParticipation != null);
      if (appreciation.status === "fulfilled") setAppreciationStatus(appreciation.value);
      if (wyr.status === "fulfilled") setWyrData(wyr.value);
      if (spotlight.status === "fulfilled") setSpotlightStatus(spotlight.value);
      if (dare.status === "fulfilled") setDareData(dare.value);
    });
    return () => {
      cancelled = true;
    };
  }, [relationshipId, localDateStr]);

  const todayDate = localDateStr
    ? new Date(localDateStr + "T00:00:00.000Z")
    : new Date();
  const featuredMode = getDayTheme(todayDate).featuredMode;

  return (
    <main className="flex flex-col gap-2">
      {relationships.length > 0 ? (
        <div className="ns-stack animate-fade-in-ease">
          <AnniversaryBanner
            anniversaryISO={relationships[0]?.anniversaryISO ?? null}
          />
          {isAnniversaryToday(relationships[0]?.anniversaryISO ?? null) && (
            <MilestonePromptCard
              relationshipId={relationshipId!}
              context="anniversary"
              eyebrow="Anniversary question"
            />
          )}
          <TodaySection relationshipId={relationshipId!} />
          <QuestCard relationshipId={relationshipId!} />
          <PushPrompt />

          <IssuePromo relationshipId={relationshipId!} />
          <RecapPromo />

          <section className="space-y-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
              Today&apos;s bonus
            </p>

            {(() => {
              // urgent: something from your partner is waiting. done: nothing left to do today.
              type RowEntry = { key: string; featuredKey: string | null; node: React.ReactNode; urgent?: boolean; done?: boolean };
              const rows: RowEntry[] = [];

              rows.push({
                key: "dare",
                featuredKey: "dare",
                done: !!dareData?.completed,
                node: (
                  <RowShell href="/app/dare" featured={featuredMode === "dare"}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-peach-50 text-peach-600">
                      <Flame className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">Date Night Dare</p>
                      <p className="truncate text-sm text-slate-500">
                        {dareData === null
                          ? "A new dare every week."
                          : dareData.completed
                            ? "Done this week. Nice work."
                            : dareData.accepted
                              ? `In progress: ${dareData.dare.title}`
                              : dareData.dare.title}
                      </p>
                    </div>
                    {dareData?.completed ? (
                      <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} aria-label="Completed" />
                    ) : (
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    )}
                  </RowShell>
                ),
              });

              if (spotlightStatus && spotlightStatus.type !== "none") {
                rows.push({
                  key: "spotlight",
                  featuredKey: null,
                  urgent: spotlightStatus.type === "received",
                  done: spotlightStatus.type === "sent",
                  node: (
                    <RowShell href="/app/spotlight" featured={false}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                        <Sparkles className="h-5 w-5" strokeWidth={2} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">Partner Spotlight</p>
                        <p className="truncate text-sm text-slate-500">
                          {spotlightStatus.type === "received"
                            ? `${spotlightStatus.fromName ?? "Your partner"} wrote 3 things for you.`
                            : spotlightStatus.type === "sent"
                              ? "You sent your spotlight this month."
                              : "Tell them 3 things you love about them."}
                        </p>
                      </div>
                      {spotlightStatus.type === "received" ? (
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500 animate-pulse" aria-label="New" />
                      ) : spotlightStatus.type === "sent" ? (
                        <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} aria-label="Sent" />
                      ) : (
                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                      )}
                    </RowShell>
                  ),
                });
              }

              rows.push({
                key: "wyr",
                featuredKey: null,
                done: wyrData?.state === "revealed",
                node: (
                  <RowShell href="/app/wyr" featured={false}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dusk-50 text-dusk-600">
                      <Shuffle className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">Would You Rather</p>
                      <p className="truncate text-sm text-slate-500">
                        {wyrData === null
                          ? "Pick one — see if you match."
                          : wyrData.state === "revealed"
                            ? wyrData.reveal?.matched
                              ? "You're aligned today."
                              : "You went different directions."
                            : wyrData.myChoice != null
                              ? `Waiting for ${wyrData.partnerName ?? "them"}…`
                              : "Pick one — see if you match."}
                      </p>
                    </div>
                    {wyrData?.state === "revealed" ? (
                      <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} aria-label="Done" />
                    ) : (
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    )}
                  </RowShell>
                ),
              });

              rows.push({
                key: "quiz",
                featuredKey: "quiz",
                done: quizDoneToday === true,
                node: (
                  <RowShell href="/app/quiz" featured={featuredMode === "quiz"}>
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
                  </RowShell>
                ),
              });

              if (appreciationStatus && appreciationStatus.type !== "none") {
                rows.push({
                  key: "appreciation",
                  featuredKey: "appreciation",
                  urgent: appreciationStatus.type === "received",
                  done: appreciationStatus.type === "sent",
                  node: (
                    <RowShell href="/app/appreciation" featured={featuredMode === "appreciation"}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                        <Heart className="h-5 w-5" strokeWidth={2} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">Appreciation</p>
                        <p className="truncate text-sm text-slate-500">
                          {appreciationStatus.type === "received"
                            ? `${appreciationStatus.fromName ?? "Your partner"} left you something.`
                            : appreciationStatus.type === "sent"
                              ? "You sent one this week."
                              : "Tell them something you noticed."}
                        </p>
                      </div>
                      {appreciationStatus.type === "received" ? (
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500 animate-pulse" aria-label="New" />
                      ) : appreciationStatus.type === "sent" ? (
                        <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} aria-label="Sent" />
                      ) : (
                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                      )}
                    </RowShell>
                  ),
                });
              }

              rows.push({
                key: "agreement",
                featuredKey: null,
                done: agreementDoneToday === true,
                node: (
                  <RowShell href="/app/agreement" featured={false}>
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
                  </RowShell>
                ),
              });

              rows.push({
                key: "meeting",
                featuredKey: null,
                node: (
                  <RowShell href="/app/meeting" featured={false}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dusk-50 text-dusk-600">
                      <CalendarRange className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">Weekly check-in</p>
                      <p className="truncate text-sm text-slate-500">Wins, stressors, one ask. Whenever you want.</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  </RowShell>
                ),
              });

              const ordered = rows.slice().sort((a, b) => {
                const af = featuredMode && a.featuredKey === featuredMode ? -1 : 0;
                const bf = featuredMode && b.featuredKey === featuredMode ? -1 : 0;
                return af - bf;
              });

              // One thing a day. The daily question is the habit; everything
              // else used to compete with it as a list of seven. Show a single
              // bonus: whatever your partner left you, else today's featured
              // activity, else a different undone one each day. The rest stay
              // one tap away.
              const dayIndex = Math.floor(Date.now() / 86_400_000);
              const candidates = rows.filter((r) => !r.done && r.key !== "meeting");
              const bonus =
                rows.find((r) => r.urgent) ??
                candidates.find((r) => featuredMode && r.featuredKey === featuredMode) ??
                candidates[dayIndex % Math.max(candidates.length, 1)] ??
                ordered[0]!;
              const rest = ordered.filter((r) => r !== bonus);

              return (
                <>
                  <div className="animate-card-pop-in" style={{ animationDelay: "90ms" }}>
                    {bonus.node}
                  </div>
                  <details className="group pt-1">
                    <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium text-slate-500 transition hover:text-slate-700 [&::-webkit-details-marker]:hidden">
                      More to do together
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{rest.length}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition group-open:rotate-90" aria-hidden />
                    </summary>
                    <div className="mt-2 space-y-2">
                      {rest.map((r) => (
                        <div key={r.key}>{r.node}</div>
                      ))}
                    </div>
                  </details>
                </>
              );
            })()}
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
