// apps/aligned/scripts/smoke-throwback.ts
// Smoke for pure helpers in lib/throwback.ts. Run: npx tsx scripts/smoke-throwback.ts
import { __testing } from "../lib/throwback";

function assert(name: string, cond: boolean) {
  if (!cond) {
    console.error(`FAIL ${name}`);
    process.exit(1);
  }
  console.log(`PASS ${name}`);
}

// isSaturday — 2026-05-02 is a Saturday in UTC
assert("Saturday 2026-05-02", __testing.isSaturday("2026-05-02"));
assert("Not Saturday 2026-05-01", !__testing.isSaturday("2026-05-01"));

// isThrowbackDay — deterministic per (relationshipId + dateStr)
const a = __testing.isThrowbackDay("rel-1", "2026-05-02");
const b = __testing.isThrowbackDay("rel-1", "2026-05-02");
assert("isThrowbackDay deterministic", a === b);

// monthsBetween — 60 days ~ 2 months
const from = new Date("2026-01-01T00:00:00.000Z");
const to = new Date("2026-03-02T00:00:00.000Z");
assert("monthsBetween ~2", __testing.monthsBetween(from, to) === 2);

// hash — stable
assert("hash stable", __testing.hash("abc") === __testing.hash("abc"));
assert("hash distinct", __testing.hash("abc") !== __testing.hash("abcd"));

console.log("ALL PASS");
