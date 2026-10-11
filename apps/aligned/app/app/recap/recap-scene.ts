import type { WeeklyRecap } from "@/lib/weekly-recap";

/**
 * "Your week together" as a scene: one pure function that draws any frame
 * at time t. The in-app player and the video recorder both call it, so the
 * video someone shares is exactly what they watched.
 *
 * Numbers and shared single words only. Never answer or question text.
 */

export const W = 1080;
export const H = 1920; // 9:16, the shape of a story
export const DURATION = 15;

export type SceneFonts = { display: string; sans: string };

const INK = "#F5EFE3";
const INK_SOFT = "rgba(245, 239, 227, 0.62)";
const PEACH = "#F2966E";
const PEACH_DEEP = "#E07A5F";
const GOLD = "#FFD9A8";

// ── timing helpers ─────────────────────────────────────────────────────
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const prog = (t: number, start: number, dur: number) => clamp((t - start) / dur);
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const easeBack = (p: number) => {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
};
/** Fade a whole scene in and out. */
const sceneAlpha = (t: number, start: number, end: number) =>
  Math.min(prog(t, start, 0.35), 1 - prog(t, end - 0.4, 0.4));

// ── deterministic star field ───────────────────────────────────────────
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261011);
const FIELD = Array.from({ length: 110 }, () => ({
  x: rand() * W,
  y: rand() * H,
  r: 0.8 + rand() * 2.2,
  phase: rand() * Math.PI * 2,
  speed: 0.6 + rand() * 1.6,
}));

function drawBackground(ctx: CanvasRenderingContext2D, t: number) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#14304D");
  bg.addColorStop(0.55, "#0B1B2E");
  bg.addColorStop(1, "#060D16");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // A warm glow low on the horizon, breathing slowly.
  const glow = ctx.createRadialGradient(W / 2, H * 1.05, 0, W / 2, H * 1.05, H * 0.75);
  glow.addColorStop(0, `rgba(224, 122, 95, ${0.2 + 0.04 * Math.sin(t * 0.8)})`);
  glow.addColorStop(1, "rgba(224, 122, 95, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  for (const s of FIELD) {
    const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
    ctx.fillStyle = `rgba(255, 244, 228, ${a})`;
    const y = (((s.y - t * 6) % H) + H) % H; // slow upward drift, wrapping
    ctx.beginPath();
    ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── text helpers ───────────────────────────────────────────────────────
function font(f: string, size: number, weight = 600, italic = false) {
  return `${italic ? "italic " : ""}${weight} ${size}px ${f}`;
}

/** Largest size (≤ max) at which text fits the width. */
function fitSize(ctx: CanvasRenderingContext2D, text: string, fam: string, max: number, maxW: number, weight = 600, italic = false) {
  let size = max;
  ctx.font = font(fam, size, weight, italic);
  while (size > 28 && ctx.measureText(text).width > maxW) {
    size -= 4;
    ctx.font = font(fam, size, weight, italic);
  }
  return size;
}

/** Text rising out of a mask below its baseline, like the in-app reveal. */
function riseText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  p: number,
  opts: { color?: string; align?: CanvasTextAlign } = {}
) {
  if (p <= 0) return;
  const e = easeOut(p);
  ctx.save();
  ctx.textAlign = opts.align ?? "center";
  ctx.textBaseline = "alphabetic";
  const w = ctx.measureText(text).width;
  const left = opts.align === "left" ? x : opts.align === "right" ? x - w : x - w / 2;
  ctx.beginPath();
  ctx.rect(left - 40, y - size * 1.25, w + 80, size * 1.55);
  ctx.clip();
  ctx.globalAlpha *= clamp(p * 1.6);
  ctx.fillStyle = opts.color ?? INK;
  ctx.fillText(text, x, y + (1 - e) * size * 0.85);
  ctx.restore();
}

/** A sentence whose words rise one after another. */
function riseWords(
  ctx: CanvasRenderingContext2D,
  words: string[],
  cx: number,
  y: number,
  size: number,
  t: number,
  start: number,
  stagger: number,
  color = INK
) {
  const space = ctx.measureText(" ").width;
  const widths = words.map((w) => ctx.measureText(w).width);
  const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
  let x = cx - total / 2;
  words.forEach((w, i) => {
    riseText(ctx, w, x, y, size, prog(t, start + i * stagger, 0.55), { color, align: "left" });
    x += widths[i]! + space;
  });
}

function fadeText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, p: number, color = INK_SOFT) {
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha *= easeOut(p);
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y + (1 - easeOut(p)) * 18);
  ctx.restore();
}

function spaced(text: string) {
  return text.toUpperCase().split("").join(String.fromCharCode(8202));
}

// ── scenes ─────────────────────────────────────────────────────────────
const S = {
  title: [0, 3.0],
  days: [3.0, 6.8],
  word: [6.8, 10.8],
  sky: [10.8, 13.5],
  end: [13.5, DURATION + 1],
} as const;

function sceneTitle(ctx: CanvasRenderingContext2D, t: number, r: WeeklyRecap, f: SceneFonts) {
  const names = r.names.length >= 2 ? `${r.names[0]} & ${r.names[1]}` : r.names[0] ?? "Us";
  ctx.font = font(f.sans, 36, 600);
  fadeText(ctx, spaced(names), W / 2, 700, prog(t, 0.2, 0.6), PEACH);
  ctx.font = font(f.display, 170, 600);
  riseWords(ctx, ["Our", "week"], W / 2, 900, 170, t, 0.5, 0.22);
  ctx.font = font(f.sans, 40, 500);
  fadeText(ctx, r.rangeLabel, W / 2, 1000, prog(t, 1.2, 0.6));
}

function sceneDays(ctx: CanvasRenderingContext2D, t: number, r: WeeklyRecap, f: SceneFonts) {
  const [s] = S.days;
  ctx.font = font(f.display, 74, 600);
  riseWords(ctx, ["Days", "we", "showed", "up"], W / 2, 640, 74, t, s + 0.1, 0.12);

  const gap = 138;
  const x0 = W / 2 - gap * 3;
  r.days.forEach((d, i) => {
    const p = prog(t, s + 0.7 + i * 0.22, 0.4);
    const cx = x0 + i * gap;
    const cy = 880;
    ctx.save();
    if (d.together) {
      const sc = p > 0 ? easeBack(p) : 0;
      // ring always visible, fill pops in
      ctx.strokeStyle = "rgba(245,239,227,0.25)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 48, 0, Math.PI * 2);
      ctx.stroke();
      if (sc > 0) {
        ctx.shadowColor = "rgba(242,150,110,0.9)";
        ctx.shadowBlur = 40 * clamp(p);
        ctx.fillStyle = PEACH;
        ctx.beginPath();
        ctx.arc(cx, cy, 48 * sc, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.globalAlpha = 0.25 + 0.2 * (1 - p);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 48, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.font = font(f.sans, 34, 600);
    ctx.textAlign = "center";
    ctx.fillStyle = d.together && p > 0 ? INK : "rgba(245,239,227,0.4)";
    ctx.fillText(d.label, cx, cy + 108);
  });

  // The count, rolling up as the dots fill.
  const countP = prog(t, s + 0.7, 0.22 * 7 + 0.4);
  const shown = Math.round(r.daysTogether * easeOut(countP));
  if (countP > 0) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = font(f.sans, 280, 700);
    const num = String(shown);
    const numW = ctx.measureText(num).width;
    ctx.font = font(f.display, 96, 500);
    const tail = " of 7";
    const tailW = ctx.measureText(tail).width;
    const left = W / 2 - (numW + tailW) / 2;
    ctx.globalAlpha = clamp(countP * 3);
    ctx.textAlign = "left";
    ctx.font = font(f.sans, 280, 700);
    ctx.fillStyle = INK;
    ctx.fillText(num, left, 1330);
    ctx.font = font(f.display, 96, 500);
    ctx.fillStyle = INK_SOFT;
    ctx.fillText(tail, left + numW, 1330);
    ctx.restore();
  }
  ctx.font = font(f.sans, 44, 500);
  const line = r.daysTogether === 7 ? "A perfect week." : r.daysTogether >= 5 ? "That's a rhythm." : "Every one of them counts.";
  fadeText(ctx, line, W / 2, 1450, prog(t, s + 2.6, 0.5), r.daysTogether === 7 ? PEACH : INK_SOFT);
}

function sceneWord(ctx: CanvasRenderingContext2D, t: number, r: WeeklyRecap, f: SceneFonts) {
  const [s] = S.word;
  const [top, ...rest] = r.sharedWords;

  if (!top) {
    ctx.font = font(f.display, 110, 600);
    riseWords(ctx, ["Different", "words."], W / 2, 860, 110, t, s + 0.2, 0.2);
    ctx.font = font(f.display, 110, 600, true);
    riseWords(ctx, ["Same", "evenings."], W / 2, 1010, 110, t, s + 0.8, 0.2, PEACH);
    return;
  }

  ctx.font = font(f.sans, 36, 600);
  fadeText(ctx, spaced("The word we both kept using"), W / 2, 640, prog(t, s + 0.1, 0.5), PEACH);

  // The word lands on its own beat, then a highlighter sweeps under it.
  const size = fitSize(ctx, top, f.display, 220, W - 160, 600, true);
  ctx.font = font(f.display, size, 600, true);
  const wordW = ctx.measureText(top).width;
  const landP = prog(t, s + 0.7, 0.6);
  const sweepP = easeOut(prog(t, s + 1.25, 0.5));
  const baseY = 980;
  if (sweepP > 0) {
    ctx.save();
    ctx.fillStyle = "rgba(242,150,110,0.45)";
    ctx.fillRect(W / 2 - wordW / 2 - 16, baseY - size * 0.38, (wordW + 32) * sweepP, size * 0.4);
    ctx.restore();
  }
  if (landP > 0) {
    ctx.save();
    const sc = 0.85 + 0.15 * easeBack(landP);
    ctx.translate(W / 2, baseY);
    ctx.scale(sc, sc);
    ctx.globalAlpha = clamp(landP * 2);
    ctx.shadowColor = "rgba(255,176,140,0.7)";
    ctx.shadowBlur = 50 * (1 - landP) + 18;
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(top, 0, (1 - easeOut(landP)) * 60);
    ctx.restore();
  }

  // The other shared words drop in as pills.
  if (rest.length) {
    ctx.font = font(f.sans, 40, 600);
    const pad = 34;
    const widths = rest.map((w) => ctx.measureText(w).width + pad * 2);
    const total = widths.reduce((a, b) => a + b, 0) + 24 * (rest.length - 1);
    let x = W / 2 - total / 2;
    rest.forEach((w, i) => {
      const p = prog(t, s + 1.9 + i * 0.16, 0.45);
      if (p > 0) {
        ctx.save();
        ctx.globalAlpha = clamp(p * 2);
        const y = 1170 - (1 - easeBack(p)) * 30;
        ctx.fillStyle = "rgba(242,150,110,0.9)";
        ctx.beginPath();
        // roundRect is iOS 16+; plain corners are fine on older phones.
        if (typeof ctx.roundRect === "function") ctx.roundRect(x, y - 52, widths[i]!, 76, 38);
        else ctx.rect(x, y - 52, widths[i]!, 76);
        ctx.fill();
        ctx.fillStyle = "#2A1F2D";
        ctx.textAlign = "center";
        ctx.fillText(w, x + widths[i]! / 2, y);
        ctx.restore();
      }
      x += widths[i]! + 24;
    });
  }
  ctx.font = font(f.sans, 40, 500);
  const aligned = r.alignedDays;
  if (aligned > 0) {
    fadeText(
      ctx,
      `Aligned on ${aligned} ${aligned === 1 ? "day" : "days"} this week`,
      W / 2,
      1330,
      prog(t, s + 2.4, 0.5)
    );
  }
}

/** Star positions on a golden-angle spiral: the shape of their in-app sky. */
function skyStar(i: number, n: number) {
  const a = i * 2.39996;
  const rad = 300 * Math.sqrt((i + 0.5) / Math.max(n, 1));
  return { x: W / 2 + Math.cos(a) * rad, y: 800 + Math.sin(a) * rad };
}

function sceneSky(ctx: CanvasRenderingContext2D, t: number, r: WeeklyRecap, f: SceneFonts) {
  const [s] = S.sky;
  const n = Math.min(Math.max(r.totalStars, 1), 90);
  // Older stars appear quickly; the newest one falls in last.
  for (let i = 0; i < n - 1; i++) {
    const p = prog(t, s + 0.1 + (i / n) * 0.8, 0.3);
    if (p <= 0) continue;
    const { x, y } = skyStar(i, n);
    ctx.fillStyle = `rgba(255, 236, 210, ${0.55 * p})`;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  const last = skyStar(n - 1, n);
  const fall = prog(t, s + 1.0, 0.6);
  if (fall > 0) {
    const e = easeOut(fall);
    const x = last.x;
    const y = -60 + (last.y + 60) * e;
    ctx.save();
    ctx.strokeStyle = `rgba(255,217,168,${0.6 * (1 - e)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - 160 * (1 - e));
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 50;
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(x, y, 11 + (fall >= 1 ? 3 * Math.sin(t * 5) : 0), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Fraunces' display numerals are too quirky at this size; numbers use the sans.
  ctx.font = font(f.sans, 72, 600);
  const stars = `${r.totalStars} ${r.totalStars === 1 ? "star" : "stars"} in our sky`;
  riseText(ctx, stars, W / 2, 1250, 72, prog(t, s + 0.6, 0.6));
  if (r.streak > 0) {
    const p = prog(t, s + 1.2, 0.9);
    ctx.font = font(f.sans, 52, 600);
    fadeText(ctx, `${Math.round(r.streak * easeOut(p))}-day streak`, W / 2, 1350, p, PEACH);
  }
}

function sceneEnd(ctx: CanvasRenderingContext2D, t: number, f: SceneFonts) {
  const [s] = S.end;
  const p = prog(t, s + 0.1, 0.5);
  if (p > 0) {
    ctx.save();
    ctx.translate(W / 2, 800);
    const sc = easeBack(p);
    ctx.scale(sc, sc);
    ctx.shadowColor = "rgba(224,122,95,0.8)";
    ctx.shadowBlur = 40;
    ctx.fillStyle = PEACH_DEEP;
    ctx.beginPath();
    ctx.arc(0, 0, 78, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,220,200,0.45)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = font(f.display, 64, 600, true);
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFF4EA";
    ctx.fillText("A", 0, 22);
    ctx.restore();
  }
  ctx.font = font(f.display, 120, 600);
  riseText(ctx, "Aligned", W / 2, 1040, 120, prog(t, s + 0.3, 0.6));
  ctx.font = font(f.sans, 44, 500);
  fadeText(ctx, "One question a day, for two.", W / 2, 1130, prog(t, s + 0.6, 0.5));
  ctx.font = font(f.sans, 34, 500);
  fadeText(ctx, "alignedconnectingcouples.com", W / 2, H - 150, prog(t, s + 0.8, 0.5), "rgba(245,239,227,0.5)");
}

/** Draw one frame of the recap at time t (seconds). */
export function drawRecapFrame(ctx: CanvasRenderingContext2D, t: number, r: WeeklyRecap, f: SceneFonts) {
  drawBackground(ctx, t);
  const scenes: [readonly [number, number], () => void][] = [
    [S.title, () => sceneTitle(ctx, t, r, f)],
    [S.days, () => sceneDays(ctx, t, r, f)],
    [S.word, () => sceneWord(ctx, t, r, f)],
    [S.sky, () => sceneSky(ctx, t, r, f)],
    [S.end, () => sceneEnd(ctx, t, f)],
  ];
  for (const [[start, end], draw] of scenes) {
    if (t < start || t > end) continue;
    ctx.save();
    ctx.globalAlpha = sceneAlpha(t, start, end);
    draw();
    ctx.restore();
  }
}

/** Moments worth a haptic tap while it plays. */
export function recapCues(r: WeeklyRecap): { t: number; kind: "tap" | "success" }[] {
  const cues: { t: number; kind: "tap" | "success" }[] = [];
  r.days.forEach((d, i) => {
    if (d.together) cues.push({ t: S.days[0] + 0.7 + i * 0.22 + 0.15, kind: "tap" });
  });
  if (r.sharedWords.length) cues.push({ t: S.word[0] + 0.95, kind: "success" });
  cues.push({ t: S.sky[0] + 1.55, kind: "tap" });
  cues.push({ t: S.end[0] + 0.3, kind: "success" });
  return cues;
}

/**
 * A single still that carries the whole week, for reduced motion and for
 * devices that can't record video.
 */
export function drawRecapPoster(ctx: CanvasRenderingContext2D, r: WeeklyRecap, f: SceneFonts) {
  drawBackground(ctx, 0);
  const names = r.names.length >= 2 ? `${r.names[0]} & ${r.names[1]}` : r.names[0] ?? "Us";
  ctx.textAlign = "center";
  ctx.font = font(f.sans, 36, 600);
  ctx.fillStyle = PEACH;
  ctx.fillText(spaced(names), W / 2, 300);
  ctx.font = font(f.display, 150, 600);
  ctx.fillStyle = INK;
  ctx.fillText("Our week", W / 2, 470);
  ctx.font = font(f.sans, 40, 500);
  ctx.fillStyle = INK_SOFT;
  ctx.fillText(r.rangeLabel, W / 2, 550);

  const gap = 138;
  const x0 = W / 2 - gap * 3;
  r.days.forEach((d, i) => {
    const cx = x0 + i * gap;
    ctx.beginPath();
    ctx.arc(cx, 720, 48, 0, Math.PI * 2);
    if (d.together) {
      ctx.fillStyle = PEACH;
      ctx.fill();
    } else {
      ctx.strokeStyle = "rgba(245,239,227,0.35)";
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.font = font(f.sans, 34, 600);
    ctx.fillStyle = d.together ? INK : "rgba(245,239,227,0.4)";
    ctx.fillText(d.label, cx, 828);
  });
  ctx.font = font(f.sans, 56, 600);
  ctx.fillStyle = INK;
  ctx.fillText(`${r.daysTogether} of 7 days together`, W / 2, 960);

  const [top] = r.sharedWords;
  if (top) {
    ctx.font = font(f.sans, 34, 600);
    ctx.fillStyle = PEACH;
    ctx.fillText(spaced("The word we both kept using"), W / 2, 1120);
    const size = fitSize(ctx, top, f.display, 200, W - 160, 600, true);
    ctx.font = font(f.display, size, 600, true);
    const wW = ctx.measureText(top).width;
    ctx.fillStyle = "rgba(242,150,110,0.45)";
    ctx.fillRect(W / 2 - wW / 2 - 16, 1300 - size * 0.38, wW + 32, size * 0.4);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(top, W / 2, 1300);
  }

  ctx.font = font(f.sans, 56, 600);
  ctx.fillStyle = INK;
  ctx.fillText(`${r.totalStars} ${r.totalStars === 1 ? "star" : "stars"} in our sky`, W / 2, 1500);
  if (r.streak > 0) {
    ctx.font = font(f.sans, 48, 600);
    ctx.fillStyle = PEACH;
    ctx.fillText(`${r.streak}-day streak`, W / 2, 1580);
  }
  ctx.font = font(f.display, 64, 600);
  ctx.fillStyle = INK;
  ctx.fillText("Aligned", W / 2, H - 200);
  ctx.font = font(f.sans, 32, 500);
  ctx.fillStyle = "rgba(245,239,227,0.5)";
  ctx.fillText("alignedconnectingcouples.com", W / 2, H - 140);
}
