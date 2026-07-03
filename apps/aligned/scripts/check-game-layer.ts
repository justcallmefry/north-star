/**
 * Regression checks for Game Layer Phase 1 (Grace Days + Called It).
 * No test framework in this repo yet — run directly:
 *   npm run check:game-layer -w aligned
 */
import {
  computeStreakUpdate,
  computeStreakView,
  type StreakRow,
} from "../lib/streak-core";
import { detectCalledIt } from "../lib/reveal/called-it";
import {
  computeConstellationLayout,
  milestoneLabel,
  type StarInput,
} from "../lib/constellation-core";

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.error(`FAIL ${name}\n  expected ${e}\n  actual   ${a}`);
  } else {
    console.log(`ok ${name}`);
  }
}

const row = (o: Partial<StreakRow>): StreakRow => ({
  currentCount: 0,
  longestCount: 0,
  lastCompletedDate: null,
  graceDays: 0,
  graceUsedDate: null,
  ...o,
});

// --- computeStreakUpdate ---

let u = computeStreakUpdate(null, "2026-07-03");
check("first reveal", [u.currentCount, u.longestCount, u.graceDays], [1, 1, 0]);

u = computeStreakUpdate(row({ currentCount: 5, longestCount: 5, lastCompletedDate: "2026-07-02" }), "2026-07-03");
check("consecutive", [u.currentCount, u.longestCount, u.graceJustEarned], [6, 6, false]);

u = computeStreakUpdate(row({ currentCount: 5, longestCount: 5, lastCompletedDate: "2026-07-03" }), "2026-07-03");
check("same-day noop", u.changed, false);

u = computeStreakUpdate(row({ currentCount: 6, longestCount: 6, lastCompletedDate: "2026-07-02" }), "2026-07-03");
check("earn at 7", [u.currentCount, u.graceDays, u.graceJustEarned], [7, 1, true]);

u = computeStreakUpdate(row({ currentCount: 13, longestCount: 13, lastCompletedDate: "2026-07-02", graceDays: 2 }), "2026-07-03");
check("cap respected", [u.graceDays, u.graceJustEarned], [2, false]);

u = computeStreakUpdate(row({ currentCount: 10, longestCount: 10, lastCompletedDate: "2026-07-01", graceDays: 1 }), "2026-07-03");
check("grace bridge", [u.currentCount, u.graceDays, u.graceJustUsed, u.graceUsedDate], [11, 0, true, "2026-07-02"]);

u = computeStreakUpdate(row({ currentCount: 10, longestCount: 10, lastCompletedDate: "2026-07-01" }), "2026-07-03");
check("no grace reset", [u.currentCount, u.longestCount], [1, 10]);

u = computeStreakUpdate(row({ currentCount: 10, longestCount: 10, lastCompletedDate: "2026-06-30", graceDays: 2 }), "2026-07-03");
check("two-day miss resets", [u.currentCount, u.graceDays], [1, 2]);

u = computeStreakUpdate(row({ currentCount: 6, longestCount: 6, lastCompletedDate: "2026-07-01", graceDays: 1 }), "2026-07-03");
check("bridge to 7 re-earns", [u.currentCount, u.graceDays, u.graceJustUsed, u.graceJustEarned], [7, 1, true, true]);

u = computeStreakUpdate(row({ currentCount: 3, longestCount: 3, lastCompletedDate: "2026-06-30" }), "2026-07-01");
check("month boundary consecutive", u.currentCount, 4);

// --- computeStreakView ---

let v = computeStreakView(row({ currentCount: 7, longestCount: 7, lastCompletedDate: "2026-07-03", graceDays: 1 }), "2026-07-03");
check("view today", [v.currentCount, v.graceDays, v.graceJustEarned], [7, 1, true]);

v = computeStreakView(row({ currentCount: 7, longestCount: 7, lastCompletedDate: "2026-07-02" }), "2026-07-03");
check("view yesterday", [v.currentCount, v.graceArmed], [7, false]);

v = computeStreakView(row({ currentCount: 7, longestCount: 7, lastCompletedDate: "2026-07-01", graceDays: 1 }), "2026-07-03");
check("view armed", [v.currentCount, v.graceArmed, v.justReset], [7, true, false]);

v = computeStreakView(row({ currentCount: 7, longestCount: 7, lastCompletedDate: "2026-07-01" }), "2026-07-03");
check("view reset", [v.currentCount, v.justReset], [0, true]);

v = computeStreakView(row({ currentCount: 11, longestCount: 11, lastCompletedDate: "2026-07-03", graceUsedDate: "2026-07-02" }), "2026-07-03");
check("view graceJustUsed", v.graceJustUsed, true);

v = computeStreakView(row({ currentCount: 11, longestCount: 11, lastCompletedDate: "2026-07-03", graceUsedDate: "2026-06-20" }), "2026-07-03");
check("view stale graceUsedDate", v.graceJustUsed, false);

// --- detectCalledIt ---

check("simple hit", detectCalledIt("beach", "I want to go to the beach with you"), ["beach"]);
check("short word hit", detectCalledIt("dog", "Getting a dog someday!"), ["dog"]);
check("case + punctuation", detectCalledIt("Coffee!", "coffee, always coffee."), ["coffee"]);
check("phrase partial hit", detectCalledIt("road trip to the coast", "a long road trip"), ["road", "trip"]);
check("stopwords never match", detectCalledIt("the and with", "the and with everything"), []);
check("miss", detectCalledIt("mountains", "I dream about the ocean"), []);
check("empty guess", detectCalledIt("", "anything"), []);
check("empty answer", detectCalledIt("word", ""), []);
check("dedup", detectCalledIt("home home home", "our home is my favorite place"), ["home"]);

// --- constellation layout ---

const mkStar = (i: number, o: Partial<StarInput> = {}): StarInput => ({
  id: `s${i}`,
  date: "2026-07-03",
  aligned: "none",
  saved: false,
  milestone: null,
  ...o,
});

check("milestone labels", [milestoneLabel(7), milestoneLabel(30), milestoneLabel(100), milestoneLabel(365), milestoneLabel(8)],
  ["One week", "Thirty days", "One hundred", "A whole year", null]);

// Empty sky
let layout = computeConstellationLayout([]);
check("empty sky", [layout.stars.length, layout.links.length], [0, 0]);
check("empty sky has valid viewBox", layout.viewBox.width > 0, true);

// First star sits at the center
layout = computeConstellationLayout([mkStar(0)]);
check("first star centered", [layout.stars[0]!.x, layout.stars[0]!.y], [0, 0]);

// Determinism: same input → same layout
const inputs = Array.from({ length: 40 }, (_, i) =>
  mkStar(i, { aligned: i % 5 === 0 ? "aligned" : "none", saved: i % 7 === 0 })
);
const a1 = computeConstellationLayout(inputs);
const a2 = computeConstellationLayout(inputs);
check("deterministic layout", JSON.stringify(a1) === JSON.stringify(a2), true);

// Sky grows with history
const small = computeConstellationLayout(Array.from({ length: 10 }, (_, i) => mkStar(i)));
const large = computeConstellationLayout(Array.from({ length: 200 }, (_, i) => mkStar(i)));
check("sky grows", large.viewBox.width > small.viewBox.width, true);

// All stars inside the viewBox
const outOfBounds = large.stars.filter(
  (s) =>
    s.x - s.r < large.viewBox.minX ||
    s.y - s.r < large.viewBox.minY ||
    s.x + s.r > large.viewBox.minX + large.viewBox.width ||
    s.y + s.r > large.viewBox.minY + large.viewBox.height
);
check("stars within viewBox", outOfBounds.length, 0);

// Links only between close aligned stars
const linked = computeConstellationLayout([
  mkStar(0, { aligned: "aligned" }),
  mkStar(1),
  mkStar(2, { aligned: "deeplyAligned" }),  // gap 2 from star 0 → linked
  ...Array.from({ length: 10 }, (_, i) => mkStar(3 + i)),
  mkStar(13, { aligned: "aligned" }),        // gap 11 from star 2 → NOT linked
]);
check("close aligned stars link", linked.links.length, 1);
check("link endpoints", [linked.links[0]!.fromId, linked.links[0]!.toId], ["s0", "s2"]);

// Milestone stars get the largest tier regardless of alignment
layout = computeConstellationLayout([mkStar(0, { milestone: "One week", aligned: "aligned" })]);
check("milestone tier wins", layout.stars[0]!.tier, "milestone");

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("\nAll game-layer checks passed.");
