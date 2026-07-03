"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { ConstellationData } from "@/lib/constellation";
import {
  computeConstellationLayout,
  type PositionedStar,
} from "@/lib/constellation-core";
import { getCouplePalette } from "@/lib/couple-colors";

type Props = { data: ConstellationData };

const TIER_LABEL: Record<PositionedStar["tier"], string> = {
  base: "You both showed up",
  aligned: "✨ Aligned answers",
  deeplyAligned: "✨ Deeply aligned",
  milestone: "Milestone",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00.000Z").toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ConstellationClient({ data }: Props) {
  const palette = getCouplePalette(data.relationshipId);
  const layout = useMemo(() => computeConstellationLayout(data.stars), [data.stars]);
  const [selected, setSelected] = useState<PositionedStar | null>(null);

  const starFill = (star: PositionedStar): string => {
    if (star.tier === "milestone") return palette.primary;
    if (star.tier === "aligned" || star.tier === "deeplyAligned") return palette.secondary;
    return "#F5EFE3";
  };

  return (
    <div className="animate-calm-fade-in space-y-5">
      <header className="space-y-2">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Today
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full bg-dusk-50 px-3 py-1 ring-1 ring-dusk-200">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-dusk-500">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-dusk-600">
            {palette.label}
          </span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
          Your sky
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Every star is a day you showed up for each other. It only ever grows.
        </p>
      </header>

      {data.totals.stars === 0 ? (
        <section className="rounded-2xl border border-dusk-100 bg-gradient-to-b from-dusk-800 to-slate-950 px-6 py-14 text-center">
          <p className="text-lg font-semibold text-white">Your sky is waiting.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-300">
            Answer today&apos;s question together to place the first star.
          </p>
          <Link
            href="/app"
            className="ns-btn-primary mt-6 inline-block px-6 py-3 transition active:scale-[0.98]"
          >
            Answer today&apos;s question
          </Link>
        </section>
      ) : (
        <>
          {/* Stats */}
          <p className="text-sm font-medium text-slate-600">
            {data.totals.stars} star{data.totals.stars === 1 ? "" : "s"}
            <span className="mx-1.5 text-slate-300">·</span>
            <span style={{ color: palette.secondary }}>{data.totals.aligned} aligned</span>
            <span className="mx-1.5 text-slate-300">·</span>
            {data.totals.kept} kept
          </p>

          {/* The sky */}
          <section
            className="relative overflow-hidden rounded-2xl"
            style={{
              background: "linear-gradient(180deg, #0F2740 0%, #0A1828 60%, #060D16 100%)",
            }}
            aria-label={`Your constellation: ${data.totals.stars} stars, ${data.totals.aligned} aligned days, ${data.totals.kept} saved memories.`}
          >
            <svg
              viewBox={`${layout.viewBox.minX} ${layout.viewBox.minY} ${layout.viewBox.width} ${layout.viewBox.height}`}
              className="block h-auto w-full"
              role="img"
              aria-hidden
            >
              {/* Constellation lines between aligned days */}
              {layout.links.map((link) => (
                <line
                  key={`${link.fromId}-${link.toId}`}
                  x1={link.x1}
                  y1={link.y1}
                  x2={link.x2}
                  y2={link.y2}
                  stroke={palette.secondary}
                  strokeOpacity={0.35}
                  strokeWidth={0.8}
                />
              ))}

              {/* Stars */}
              {layout.stars.map((star) => {
                const isSelected = selected?.id === star.id;
                return (
                  <g key={star.id}>
                    {star.tier !== "base" && (
                      <circle
                        cx={star.x}
                        cy={star.y}
                        r={star.r * 2.4}
                        fill={starFill(star)}
                        opacity={0.16}
                      />
                    )}
                    <circle
                      cx={star.x}
                      cy={star.y}
                      r={star.r}
                      fill={starFill(star)}
                      opacity={star.tier === "base" ? 0.85 : 1}
                      className={star.saved ? "animate-star-twinkle" : undefined}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelected(isSelected ? null : star)}
                    />
                    {isSelected && (
                      <circle
                        cx={star.x}
                        cy={star.y}
                        r={star.r + 4}
                        fill="none"
                        stroke="#FFFFFF"
                        strokeOpacity={0.7}
                        strokeWidth={1}
                      />
                    )}
                    {star.milestone && (
                      <text
                        x={star.x}
                        y={star.y - star.r - 6}
                        textAnchor="middle"
                        fontSize={10}
                        fill="#E8EDF4"
                        opacity={0.9}
                      >
                        {star.milestone}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Selected star detail */}
            {selected && (
              <div className="absolute inset-x-3 bottom-3 rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDate(selected.date)}
                      {selected.milestone && (
                        <span className="ml-2 text-dusk-600">· {selected.milestone}</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-600">
                      {TIER_LABEL[selected.tier]}
                      {selected.saved && " · Kept in memories"}
                    </p>
                  </div>
                  <Link
                    href={`/app/session/${selected.id}`}
                    className="shrink-0 rounded-full bg-dusk-500 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-dusk-600 active:scale-[0.98]"
                  >
                    That day →
                  </Link>
                </div>
              </div>
            )}
          </section>

          <p className="text-center text-xs text-slate-500">
            Brighter stars are days your answers aligned. Twinkling ones are saved
            memories. Tap any star to revisit that day.
          </p>
        </>
      )}
    </div>
  );
}
