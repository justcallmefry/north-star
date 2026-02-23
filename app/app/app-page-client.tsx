"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { ArrowRight, CalendarRange, History, HelpCircle, Scale } from "lucide-react";
import { EmptyTogetherIllustration } from "@/components/illustrations";
import { TodaySection } from "./today-section";
import { TodayRandomImage, TODAY_IMAGE_PATHS, pickDistinctRandom } from "./today-random-image";

export type Relationship = { id: string; name: string | null; status: string };
export type AppPageInitialData = {
  session: { user: { id: string; email?: string | null; name?: string | null; image?: string | null } };
  relationships: Relationship[];
};

type Props = { initialData: AppPageInitialData };

export function AppPageClient({ initialData }: Props) {
  const { session, relationships } = initialData;
  const relationshipId = relationships[0]?.id ?? null;
  const displayName = session.user.name ?? session.user.email ?? "";
  const distinctImages = useMemo(() => pickDistinctRandom(TODAY_IMAGE_PATHS, 3), []);

  return (
    <main className="flex h-full flex-col gap-2">
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
        <div className="ns-stack flex-1 min-h-0 animate-fade-in-ease overflow-auto">
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

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Link
                  href="/app/quiz"
                  className="ns-btn-secondary w-full !py-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  Daily quiz
                </Link>
                <div className="flex items-center gap-3">
                  <TodayRandomImage src={distinctImages[0]} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl" sizes="96px" />
                  <p className="text-sm text-slate-500 leading-relaxed flex-1 min-w-0">
                    Answer for yourself, then guess what your partner picked. See how well you know each other.
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Link
                  href="/app/agreement"
                  className="ns-btn-secondary w-full !py-2"
                >
                  <Scale className="h-4 w-4" />
                  Daily agreement
                </Link>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-500 leading-relaxed flex-1 min-w-0">
                    Rate each statement, then guess how your partner would answer. See how aligned you are.
                  </p>
                  <TodayRandomImage src={distinctImages[1]} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shrink-0" sizes="96px" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Link
                  href="/app/meeting"
                  className="ns-btn-secondary w-full !py-2"
                >
                  <CalendarRange className="h-4 w-4" />
                  Our Week
                </Link>
                <div className="flex items-center gap-3">
                  <TodayRandomImage src={distinctImages[2]} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shrink-0" sizes="96px" />
                  <p className="text-sm text-slate-500 leading-relaxed flex-1 min-w-0">
                    A shared place to capture this week as it unfolds.
                  </p>
                </div>
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500 sm:text-sm">
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
