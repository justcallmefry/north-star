import type { StarInput } from "@/lib/constellation-core";
import type { SkyExtra } from "@/lib/constellation";

/**
 * 3D layout for the sky: every month is its own constellation, and months
 * recede into depth. The newest month sits in front of the camera; scrolling
 * back through time means flying further into the sky.
 *
 * Pure and deterministic (seeded by star id), so the same history always
 * draws the same sky.
 */

export type SkyStar = StarInput & {
  x: number;
  y: number;
  z: number;
  /** Index of this star's month, 0 = newest. */
  month: number;
};

export type SkyMonth = {
  key: string; // YYYY-MM
  label: string; // "October 2026"
  short: string; // "Oct"
  index: number; // 0 = newest
  center: { x: number; y: number; z: number };
  starIds: string[];
};

export type PlacedExtra = SkyExtra & { x: number; y: number; z: number; month: number };

export type SkyLayout = {
  stars: SkyStar[];
  extras: PlacedExtra[];
  months: SkyMonth[];
  /** Consecutive days within a month, as index pairs into `stars`. */
  paths: Array<[number, number]>;
};

export const MONTH_GAP = 70;

function hash(str: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export function monthCenter(index: number) {
  // A slow drift so months don't stack in a straight tunnel.
  return {
    x: Math.sin(index * 1.25) * 22,
    y: Math.cos(index * 0.85) * 10,
    z: -index * MONTH_GAP,
  };
}

export function computeSkyLayout(inputs: StarInput[], extraInputs: SkyExtra[] = []): SkyLayout {
  const byMonth = new Map<string, StarInput[]>();
  for (const s of inputs) {
    const k = s.date.slice(0, 7);
    if (!byMonth.has(k)) byMonth.set(k, []);
    byMonth.get(k)!.push(s);
  }
  // A month with only a dare or an appreciation still gets a place.
  for (const e of extraInputs) {
    const k = e.date.slice(0, 7);
    if (!byMonth.has(k)) byMonth.set(k, []);
  }
  const keys = [...byMonth.keys()].sort().reverse(); // newest first

  const stars: SkyStar[] = [];
  const months: SkyMonth[] = [];
  const paths: Array<[number, number]> = [];

  keys.forEach((key, index) => {
    const center = monthCenter(index);
    const days = byMonth.get(key)!.sort((a, b) => a.date.localeCompare(b.date));
    const turn = hash(key) * Math.PI * 2;
    const ids: string[] = [];
    let prev = -1;
    for (const s of days) {
      const day = Number(s.date.slice(8, 10));
      // A loose spiral by day of month, jittered so it reads as a sky, not a chart.
      const angle = turn + day * 0.62 + (hash(s.id, 1) - 0.5) * 0.5;
      const radius = 3.5 + day * 0.62 + (hash(s.id, 2) - 0.5) * 3;
      stars.push({
        ...s,
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius * 0.72,
        z: center.z + (hash(s.id, 3) - 0.5) * 9,
        month: index,
      });
      const cur = stars.length - 1;
      if (prev >= 0) paths.push([prev, cur]);
      prev = cur;
      ids.push(s.id);
    }
    const [y, m] = key.split("-").map(Number);
    const d = new Date(Date.UTC(y!, m! - 1, 15));
    months.push({
      key,
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
      short: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
      index,
      center,
      starIds: ids,
    });
  });

  // Extras sit on an outer ring of their month, so they never hide a day.
  const monthIndex = new Map(months.map((m) => [m.key, m]));
  const extras: PlacedExtra[] = [];
  for (const e of extraInputs) {
    const m = monthIndex.get(e.date.slice(0, 7));
    if (!m) continue;
    const day = Number(e.date.slice(8, 10));
    const angle = hash(e.id, 4) * Math.PI * 2 + day * 0.2;
    const radius = 24 + hash(e.id, 5) * 6;
    extras.push({
      ...e,
      x: m.center.x + Math.cos(angle) * radius,
      y: m.center.y + Math.sin(angle) * radius * 0.6,
      z: m.center.z + (hash(e.id, 6) - 0.5) * 12,
      month: m.index,
    });
  }

  return { stars, extras, months, paths };
}
