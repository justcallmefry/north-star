"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarRange, History, HelpCircle, Scale } from "lucide-react";
import { EmptyTogetherIllustration } from "@/components/illustrations";
import { TodaySection } from "./today-section";

export type Relationship = { id: string; name: string | null; status: string };
export type AppPageInitialData = {
  session: { user: { id: string; email?: string | null; name?: string | null } };
  relationships: Relationship[];
};

type Props = { initialData: AppPageInitialData };

export function AppPageClient({ initialData }: Props) {
  const { session, relationships } = initialData;
  const relationshipId = relationships[0]?.id ?? null;
  const displayName = session.user.name ?? session.user.email ?? "";

  return (
    <main className="flex h-full flex-col ns-stack">
      <header className="flex items-center justify-between gap-4 py-1">
        <div className="flex items-center gap-4">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50/80 ring-1 ring-pink-200/80" aria-hidden>
            <Image
              src="/north-star-app-logo.png"
              alt=""
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <p className="text-base text-slate-600 sm:text-lg">
            One question a day. Answer together.
          </p>
        </div>
        <div className="hidden flex-col items-end text-xs text-slate-400 sm:flex">
          <span className="text-slate-500">Signed in as</span>
          <span className="mt-0.5 max-w-[180px] truncate text-sm font-medium text-slate-600">
            {displayName}
          </span>
        </div>
      </header>

      {relationships.length > 0 ? (
        <div className="ns-stack flex-1 animate-fade-in-ease">
          <section className="ns-stack-tight">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                  Today
                </h1>
                <p className="mt-1 text-sm text-slate-600 sm:text-base">
                  Answer honestly. You can edit until you both reveal.
                </p>
              </div>
              <Link
                href="/app/history"
                className="ns-btn-secondary hidden sm:inline-flex"
              >
                <History className="h-3.5 w-3.5" />
                History
              </Link>
            </div>

            <TodaySection relationshipId={relationshipId!} />

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Link
                  href="/app/quiz"
                  className="ns-btn-secondary w-full !py-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  Daily quiz
                </Link>
                <p className="text-center text-sm text-slate-500 leading-relaxed">
                  Answer for yourself, then guess what your partner picked. See how well you know each other.
                </p>
              </div>
              <div className="space-y-1.5">
                <Link
                  href="/app/agreement"
                  className="ns-btn-secondary w-full !py-2"
                >
                  <Scale className="h-4 w-4" />
                  Daily agreement
                </Link>
                <p className="text-center text-sm text-slate-500 leading-relaxed">
                  Rate each statement, then guess how your partner would answer. See how aligned you are.
                </p>
              </div>
              <div className="space-y-1.5">
                <Link
                  href="/app/meeting"
                  className="ns-btn-secondary w-full !py-2"
                >
                  <CalendarRange className="h-4 w-4" />
                  Our Week
                </Link>
                <p className="text-center text-sm text-slate-500 leading-relaxed">
                  A shared place to capture this week as it unfolds.
                </p>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <section className="mt-4 flex flex-1 items-center justify-center">
          <div className="ns-card max-w-md text-center">
            <div className="flex justify-center">
              <EmptyTogetherIllustration className="w-28 h-28 sm:w-32 sm:h-32" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500 sm:text-sm">
              Welcome
            </p>
            <p className="mt-3 text-xl font-semibold text-slate-900 sm:text-2xl">
              Create or join
            </p>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Create or join to get your first question. Invite your partner when you&apos;re ready.
            </p>
            <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/app/pair" className="ns-btn-primary" prefetch={false}>
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
