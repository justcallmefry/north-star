"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Circle } from "lucide-react";
import { getWeeklyQuest } from "@/lib/quests";
import type { WeeklyQuest } from "@/lib/quests";

type Props = { relationshipId: string };

function QuestItem({
  done,
  label,
  href,
}: {
  done: boolean;
  label: string;
  href: string;
}) {
  const inner = (
    <span className="flex items-center gap-2">
      {done ? (
        <CheckCircle className="h-4 w-4 shrink-0 text-amber-600" strokeWidth={2} aria-hidden />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={2} aria-hidden />
      )}
      <span className={done ? "text-slate-500 line-through decoration-slate-300" : "text-slate-700"}>
        {label}
      </span>
    </span>
  );
  return done ? (
    <span className="text-sm">{inner}</span>
  ) : (
    <Link href={href} className="text-sm transition hover:opacity-70">
      {inner}
    </Link>
  );
}

/**
 * The weekly co-op quest — an invitation, not an obligation. A golden
 * week gilds that week's stars in the couple's sky; a quiet week costs
 * nothing.
 */
export function QuestCard({ relationshipId }: Props) {
  const [quest, setQuest] = useState<WeeklyQuest | null>(null);

  useEffect(() => {
    let cancelled = false;
    getWeeklyQuest(relationshipId)
      .then((q) => {
        if (!cancelled) setQuest(q);
      })
      .catch(() => {
        // Quest card is optional chrome — stay hidden on error.
      });
    return () => {
      cancelled = true;
    };
  }, [relationshipId]);

  if (!quest) return null;

  if (quest.golden) {
    return (
      <section className="animate-calm-fade-in rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50/60 px-4 py-3.5">
        <p className="text-sm font-semibold text-amber-800">
          ✨ Golden week. You did all three — this week&apos;s stars are gilded in{" "}
          <Link href="/app/constellation" className="underline decoration-amber-300 underline-offset-2">
            your sky
          </Link>
          .
        </p>
      </section>
    );
  }

  return (
    <section className="animate-calm-fade-in rounded-2xl border border-[#EDE5D4] bg-[#FFFDF8] px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-amber-700">
          This week together
        </p>
        <span className="text-[0.68rem] text-slate-400">
          all three = a golden week in your sky
        </span>
      </div>
      <div className="mt-2.5 flex flex-col gap-1.5 sm:flex-row sm:gap-5">
        <QuestItem
          done={quest.reveals.done >= quest.reveals.target}
          label={`Answer ${quest.reveals.target} questions (${quest.reveals.done}/${quest.reveals.target})`}
          href="/app"
        />
        <QuestItem done={quest.dareDone} label="Do the dare" href="/app/dare" />
        <QuestItem done={quest.appreciationSent} label="Send an appreciation" href="/app/appreciation" />
      </div>
    </section>
  );
}
