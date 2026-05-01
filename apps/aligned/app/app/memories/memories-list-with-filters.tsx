"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { type MemoryListItem } from "@/lib/memories";
import { MemoriesFilterChips, type FilterKey } from "./memories-filter-chips";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function MemoryCard({ memory }: { memory: MemoryListItem }) {
  const { snapshot } = memory;
  if (snapshot.kind === "session_reveal") {
    const myEntry = snapshot.responses[0];
    const partnerEntry = snapshot.responses[1];
    return (
      <article className="ns-card space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          {formatDate(memory.savedAt)}
        </p>
        {snapshot.promptText && (
          <p className="font-display text-lg font-semibold leading-snug text-slate-900 sm:text-xl">
            {snapshot.promptText}
          </p>
        )}
        <div className="space-y-2">
          {myEntry && (
            <p className="rounded-xl border border-dusk-100 bg-dusk-50/50 px-3 py-2 text-base text-slate-800 sm:text-lg">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-dusk-700">
                {myEntry.name ?? "You"}
              </span>
              <br />
              {myEntry.content ?? "—"}
            </p>
          )}
          {partnerEntry && (
            <p className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-base text-slate-800 sm:text-lg">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                {partnerEntry.name ?? "Them"}
              </span>
              <br />
              {partnerEntry.content ?? "—"}
            </p>
          )}
        </div>
      </article>
    );
  }
  if (snapshot.kind === "appreciation") {
    return (
      <article className="rounded-2xl bg-gradient-to-br from-peach-300/30 to-peach-300/10 border border-peach-300/30 p-5 space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-peach-600">
          Appreciation · {formatDate(memory.savedAt)}
        </p>
        <p className="text-base leading-relaxed text-slate-800 sm:text-lg">
          {snapshot.message}
        </p>
        {snapshot.fromName && (
          <p className="text-sm text-slate-600">— {snapshot.fromName}</p>
        )}
      </article>
    );
  }
  return null;
}

type Props = {
  memories: MemoryListItem[];
};

export function MemoriesListWithFilters({ memories }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const counts = useMemo<Record<FilterKey, number>>(() => {
    const session_reveal = memories.filter(
      (m) => m.snapshot.kind === "session_reveal"
    ).length;
    const appreciation = memories.filter(
      (m) => m.snapshot.kind === "appreciation"
    ).length;
    return {
      all: memories.length,
      session_reveal,
      appreciation,
    };
  }, [memories]);

  // Determine whether to show chips:
  // - need at least 2 memories total
  // - need at least 2 distinct kinds represented
  const showChips = useMemo(() => {
    if (memories.length < 2) return false;
    const kindsPresent = (counts.session_reveal > 0 ? 1 : 0) + (counts.appreciation > 0 ? 1 : 0);
    return kindsPresent >= 2;
  }, [memories.length, counts]);

  const visibleMemories = useMemo(() => {
    if (activeFilter === "all") return memories;
    return memories.filter((m) => m.snapshot.kind === activeFilter);
  }, [memories, activeFilter]);

  if (memories.length === 0) {
    return (
      <section className="ns-card text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-peach-300/30 text-peach-600">
          <Bookmark className="h-7 w-7" strokeWidth={1.8} />
        </div>
        <p className="mt-4 text-lg font-semibold text-slate-900 sm:text-xl">
          No memories yet
        </p>
        <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
          After a reveal you both find meaningful, tap &quot;Save as a memory&quot;
          and it&apos;ll show up here for you to revisit.
        </p>
        <Link
          href="/app"
          className="ns-btn-primary mt-5 inline-flex w-full items-center justify-center gap-2 py-3 sm:w-auto sm:px-6"
        >
          Today&apos;s question
        </Link>
      </section>
    );
  }

  const filterLabel =
    activeFilter === "session_reveal"
      ? "sessions"
      : activeFilter === "appreciation"
        ? "appreciations"
        : null;

  return (
    <div className="space-y-3">
      {showChips && (
        <MemoriesFilterChips
          active={activeFilter}
          onChange={setActiveFilter}
          counts={counts}
        />
      )}
      {visibleMemories.length === 0 && filterLabel && (
        <p className="text-sm text-slate-500">No {filterLabel} saved yet.</p>
      )}
      {visibleMemories.map((m) => (
        <MemoryCard key={m.id} memory={m} />
      ))}
    </div>
  );
}
