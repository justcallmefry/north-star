"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Sparkles, X } from "lucide-react";
import { ShareSkyButton } from "./share-sky-button";
import { getSkyDay, type ConstellationData, type SkyDay } from "@/lib/constellation";
import {
  computeConstellationLayout,
  type PositionedStar,
} from "@/lib/constellation-core";
import { computeSkyLayout, type PlacedExtra, type SkyStar } from "@/lib/sky-layout";
import { nameConstellation } from "@/lib/sky-names";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getCouplePalette } from "@/lib/couple-colors";
import { haptic } from "@/lib/haptics";
import type { Sky3DHandle } from "./sky-3d";
import { Capsules, daysUntil } from "./capsules";
import type { CapsuleView } from "@/lib/time-capsules";

// three.js loads only here, and only when the 3D sky is shown.
const Sky3D = dynamic(() => import("./sky-3d").then((m) => m.Sky3D), { ssr: false });

type Props = {
  data: ConstellationData;
  bornId?: string | null;
  focusId?: string | null;
  capsules: CapsuleView[];
  anniversaryISO: string | null;
};

type StarLike = { id: string; date: string; aligned: string; saved: boolean; milestone: string | null; golden?: boolean };

const TIER_LABEL: Record<string, string> = {
  none: "You both showed up",
  aligned: "✨ Aligned answers",
  deeplyAligned: "✨ Deeply aligned",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00.000Z").toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function canDo3D(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function ConstellationClient({ data, bornId, focusId, capsules, anniversaryISO }: Props) {
  const palette = getCouplePalette(data.relationshipId);
  const flat = useMemo(() => computeConstellationLayout(data.stars), [data.stars]);
  const sky = useMemo(() => computeSkyLayout(data.stars, data.extras), [data.stars, data.extras]);
  const router = useRouter();
  const [extra, setExtra] = useState<PlacedExtra | null>(null);
  const [naming, setNaming] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [mode, setMode] = useState<"pending" | "3d" | "flat">("pending");
  const [selected, setSelected] = useState<StarLike | null>(null);
  const [day, setDay] = useState<SkyDay | null>(null);
  const [month, setMonth] = useState(0);
  const [bornLit, setBornLit] = useState(false);
  const [comet, setComet] = useState<CapsuleView | null>(null);
  const sealedCapsules = capsules.filter((c) => !c.open);
  const skyRef = useRef<SVGSVGElement | null>(null);
  const sky3d = useRef<Sky3DHandle | null>(null);

  useEffect(() => setMode(canDo3D() ? "3d" : "flat"), []);

  // Open the tapped day: question and both answers.
  useEffect(() => {
    setDay(null);
    if (!selected) return;
    let live = true;
    getSkyDay(selected.id)
      .then((d) => live && setDay(d))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [selected]);

  const bornStar = bornId ? data.stars.find((s) => s.id === bornId) ?? null : null;

  const starFill = (star: PositionedStar): string => {
    if (star.tier === "milestone") return palette.primary;
    if (star.tier === "aligned" || star.tier === "deeplyAligned") return palette.secondary;
    return "#F5EFE3";
  };

  const flatSvg = (
    <svg
      ref={skyRef}
      viewBox={`${flat.viewBox.minX} ${flat.viewBox.minY} ${flat.viewBox.width} ${flat.viewBox.height}`}
      className="block h-auto w-full"
      role="img"
      aria-hidden
    >
      {flat.links.map((link) => (
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
      {flat.stars.map((star) => (
        <g key={star.id}>
          {star.golden && (
            <circle cx={star.x} cy={star.y} r={star.r + 2.5} fill="none" stroke="#E4B95B" strokeOpacity={0.85} strokeWidth={1} />
          )}
          {star.tier !== "base" && <circle cx={star.x} cy={star.y} r={star.r * 2.4} fill={starFill(star)} opacity={0.16} />}
          <circle
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill={starFill(star)}
            opacity={star.tier === "base" ? 0.85 : 1}
            className={star.saved ? "animate-star-twinkle" : undefined}
            style={{ cursor: "pointer" }}
            onClick={() => setSelected(selected?.id === star.id ? null : star)}
          />
          {selected?.id === star.id && (
            <circle cx={star.x} cy={star.y} r={star.r + 4} fill="none" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={1} />
          )}
          {star.milestone && (
            <text x={star.x} y={star.y - star.r - 6} textAnchor="middle" fontSize={10} fill="#E8EDF4" opacity={0.9}>
              {star.milestone}
            </text>
          )}
        </g>
      ))}
    </svg>
  );

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
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-dusk-600">{palette.label}</span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">Your sky</h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Every star is a day you showed up for each other. Every month, a constellation.
        </p>
      </header>

      {data.totals.stars === 0 ? (
        <section className="rounded-2xl border border-dusk-100 bg-gradient-to-b from-dusk-800 to-slate-950 px-6 py-14 text-center">
          <p className="text-lg font-semibold text-white">Your sky is waiting.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-300">
            Answer today&apos;s question together to place the first star.
          </p>
          <Link href="/app" className="ns-btn-primary mt-6 inline-block px-6 py-3 transition active:scale-[0.98]">
            Answer today&apos;s question
          </Link>
        </section>
      ) : (
        <>
          <p className="text-sm font-medium text-slate-600">
            {data.totals.stars} star{data.totals.stars === 1 ? "" : "s"}
            <span className="mx-1.5 text-slate-300">·</span>
            <span style={{ color: palette.secondary }}>{data.totals.aligned} aligned</span>
            <span className="mx-1.5 text-slate-300">·</span>
            {data.totals.kept} kept
          </p>

          <section
            className="relative overflow-hidden rounded-2xl"
            style={{
              background: "linear-gradient(180deg, #0F2740 0%, #0A1828 60%, #060D16 100%)",
              height: mode === "3d" ? "min(68vh, 560px)" : undefined,
            }}
            aria-label={`Your sky: ${data.totals.stars} stars across ${sky.months.length} months, ${data.totals.aligned} aligned days, ${data.totals.kept} saved memories.`}
          >
            {mode === "3d" ? (
              <>
                <Sky3D
                  ref={sky3d}
                  layout={sky}
                  palette={palette}
                  bornId={bornStar ? bornId : null}
                  focusId={bornStar ? null : focusId ?? null}
                  onSelect={(s: SkyStar | null) => {
                    setSelected(s);
                    if (s) {
                      setComet(null);
                      setExtra(null);
                    }
                  }}
                  names={data.names}
                  onSelectExtra={(e) => {
                    setExtra(e);
                    setComet(null);
                  }}
                  comets={sealedCapsules.map((c) => ({ id: c.id, openOn: c.openOn }))}
                  onSelectComet={(id) => setComet(capsules.find((c) => c.id === id) ?? null)}
                  onBorn={() => {
                    setBornLit(true);
                    void haptic("success");
                    // A moment, not a banner: let it go so the sky is yours again.
                    setTimeout(() => setBornLit(false), 4500);
                  }}
                  onUnsupported={() => setMode("flat")}
                />
                {bornStar && (
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-5 text-center transition-opacity duration-700 ${
                      bornLit ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[#F2966E]">
                      Tonight&apos;s star
                    </p>
                    <p className="mt-1 font-prompt text-lg text-[#F5EFE3]">Star {data.totals.stars} in your sky</p>
                  </div>
                )}
                {!selected && !bornStar && (
                  <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[0.7rem] text-white/45">
                    Drag to look around · pinch to travel · tap a star
                  </p>
                )}
              </>
            ) : mode === "flat" ? (
              flatSvg
            ) : null}

            {extra && !selected && !comet && (
              <div className="absolute inset-x-3 bottom-3 max-h-[70%] overflow-y-auto rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#C0607A]">
                    {extra.kind === "dare" ? "Date night dare · done" : `Appreciation from ${extra.fromMe ? "you" : extra.fromName ?? "them"}`}
                    <span className="ml-1 font-normal normal-case tracking-normal text-slate-400">· {formatDate(extra.date)}</span>
                  </p>
                  <button type="button" aria-label="Close" onClick={() => setExtra(null)} className="-mr-1 rounded-full p-1 text-slate-400 hover:bg-slate-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {extra.kind === "dare" ? (
                  <>
                    <p className="mt-1 font-prompt text-base text-slate-900">{extra.title}</p>
                    {extra.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={extra.photoUrl} alt="" className="mt-2 max-h-48 w-full rounded-lg object-cover" />
                    )}
                  </>
                ) : (
                  <p className="mt-1 whitespace-pre-wrap font-prompt text-base leading-relaxed text-slate-900">{extra.content}</p>
                )}
              </div>
            )}

            {comet && !selected && (
              <div className="absolute inset-x-3 bottom-3 rounded-xl bg-[#0B1B2E]/95 px-4 py-3 text-[#F5EFE3] shadow-lg ring-1 ring-white/10 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#FFD9A8]">Time capsule · sealed</p>
                    <p className="mt-1 text-sm font-semibold">
                      Opens {formatDate(comet.openOn)} · {daysUntil(comet.openOn).toLocaleString()} days to go
                    </p>
                    <p className="text-xs text-white/55">
                      Sealed by {comet.byMe ? "you" : comet.authorName ?? "your partner"} on {formatDate(comet.createdAt.slice(0, 10))}
                    </p>
                  </div>
                  <button type="button" aria-label="Close" onClick={() => setComet(null)} className="rounded-full p-1 text-white/50 hover:bg-white/10">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {selected && (
              <div className="absolute inset-x-3 bottom-3 max-h-[70%] overflow-y-auto rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDate(selected.date)}
                      {selected.milestone && <span className="ml-2 text-dusk-600">· {selected.milestone}</span>}
                    </p>
                    <p className="text-xs text-slate-600">
                      {TIER_LABEL[selected.aligned] ?? TIER_LABEL.none}
                      {selected.saved && " · Kept in memories"}
                      {selected.golden && " · Golden week"}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setSelected(null)}
                    className="-mr-1 rounded-full p-1 text-slate-400 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {day ? (
                  <div className="mt-2 space-y-2">
                    {day.photos.length > 0 && (
                      <div className={`grid gap-1.5 ${day.photos.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                        {day.photos.map((p) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={p.url} src={p.url} alt="" className="max-h-44 w-full rounded-lg object-cover" />
                        ))}
                      </div>
                    )}
                    {day.promptText && (
                      <p className="font-prompt text-base leading-snug text-slate-900">{day.promptText}</p>
                    )}
                    {day.answers.map((a, i) => (
                      <p key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          {a.isMe ? "You" : a.name ?? "Them"}
                        </span>
                        {a.content ?? "—"}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">Opening that day…</p>
                )}
                <Link
                  href={`/app/session/${selected.id}`}
                  className="mt-2 inline-block text-xs font-semibold text-dusk-600 hover:text-dusk-800"
                >
                  Open the full day →
                </Link>
              </div>
            )}
          </section>

          {mode === "3d" && sky.months.length > 1 && (
            <nav aria-label="Months" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {sky.months.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    setMonth(m.index);
                    setSelected(null);
                    sky3d.current?.flyToMonth(m.index);
                  }}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    month === m.index ? "bg-dusk-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
                  }`}
                >
                  {m.short} · {m.starIds.length}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMonth(-1);
                  setSelected(null);
                  sky3d.current?.flyOverview();
                }}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  month === -1 ? "bg-dusk-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
                }`}
              >
                All of it
              </button>
            </nav>
          )}

          {mode === "3d" && month >= 0 && sky.months[month] && (() => {
            const m = sky.months[month]!;
            const done = m.key < new Date().toISOString().slice(0, 7);
            const given = data.names[m.key];
            if (!done) {
              return (
                <p className="text-center text-xs text-slate-500">
                  When {m.label.split(" ")[0]} ends, you&apos;ll name its constellation together.
                </p>
              );
            }
            return (
              <form
                className="flex items-center gap-2 rounded-2xl bg-white p-2 ring-1 ring-slate-200"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSavingName(true);
                  const res = await nameConstellation(m.key, naming || given || "");
                  setSavingName(false);
                  if (!res.ok) return void toast.error(res.error);
                  void haptic("success");
                  toast.success(`${m.label.split(" ")[0]} is now "${res.name}".`);
                  setNaming("");
                  router.refresh();
                }}
              >
                <input
                  value={naming}
                  onChange={(e) => setNaming(e.target.value)}
                  maxLength={40}
                  placeholder={given ? `"${given}" · rename it?` : `Name ${m.label.split(" ")[0]}'s constellation`}
                  aria-label={`Name ${m.label}'s constellation`}
                  className="min-w-0 flex-1 bg-transparent px-2 py-1.5 font-prompt text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={savingName || !naming.trim()}
                  className="shrink-0 rounded-full bg-dusk-700 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                >
                  {given ? "Rename" : "Name it"}
                </button>
              </form>
            );
          })()}

          <p className="text-center text-xs text-slate-500">
            Warm stars are days your answers aligned; twinkling ones are saved memories; gold halos are
            golden weeks. Rose stars are appreciations, and shooting stars are dares you did.
          </p>

          {/* The share card is drawn from the flat sky, kept off-screen in 3D mode. */}
          {mode === "3d" && (
            <div aria-hidden className="pointer-events-none absolute -left-[9999px] top-0 w-[400px]">
              {flatSvg}
            </div>
          )}
          <ShareSkyButton
            svgRef={skyRef}
            starCount={data.totals.stars}
            alignedCount={data.totals.aligned}
            paletteLabel={palette.label}
          />
        </>
      )}

      <Capsules capsules={capsules} anniversaryISO={anniversaryISO} />
    </div>
  );
}
