"use server";

import { prisma } from "@/lib/prisma";
import { getActiveMemberIds } from "@/lib/relationship-members";
import { sendPushToUser } from "@/lib/push";

/** Format a Date as YYYY-MM-DD (UTC date only). */
function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Get yesterday (UTC) relative to a given date string. */
function yesterdayOf(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00.000Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return toDateString(d);
}

const MILESTONE_COPY: Record<number, { title: string; body: string }> = {
  7: {
    title: "A week together.",
    body: "Seven days of showing up. That's a habit.",
  },
  30: {
    title: "30 days. That's a rhythm.",
    body: "A month of showing up. This is what becomes part of you two.",
  },
  100: {
    title: "100 days.",
    body: "Most couples don't get here. You did.",
  },
  365: {
    title: "A whole year of showing up.",
    body: "365 days of choosing each other in this small daily way.",
  },
};

function isStreakMilestone(count: number): boolean {
  return count === 7 || count === 30 || count === 100 || count === 365;
}

async function pushMilestone(userId: string, count: number): Promise<void> {
  const c = MILESTONE_COPY[count];
  if (!c) return;
  try {
    await sendPushToUser(userId, { title: c.title, body: c.body, url: "/app" });
  } catch (err) {
    console.error("[streak-milestone] push failed:", err);
  }
}

export type StreakInfo = {
  currentCount: number;
  longestCount: number;
  /** True on the first day a previous streak is no longer current (for gentle reset copy). */
  justReset?: boolean;
};

export async function getStreak(relationshipId: string): Promise<StreakInfo | null> {
  const row = await prisma.streak.findUnique({
    where: { relationshipId },
    select: { currentCount: true, longestCount: true, lastCompletedDate: true },
  });
  if (!row) return null;

  const today = new Date();
  const todayStr = toDateString(today);
  const lastStr = row.lastCompletedDate ? toDateString(row.lastCompletedDate) : null;

  let isStillCurrent = false;
  let justReset = false;

  if (lastStr) {
    const todayUTC = new Date(todayStr + "T00:00:00.000Z");
    const lastUTC = new Date(lastStr + "T00:00:00.000Z");
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysDiff = Math.round((todayUTC.getTime() - lastUTC.getTime()) / msPerDay);

    // Streak is considered \"current\" for today and the day after last completion.
    isStillCurrent = daysDiff === 0 || daysDiff === 1;
    // Gentle reset: first day where the streak is no longer current.
    justReset = daysDiff === 2 && row.currentCount > 0;
  }

  const currentCount = isStillCurrent ? row.currentCount : 0;

  return {
    currentCount,
    longestCount: row.longestCount,
    justReset,
  };
}

/**
 * Call when a daily session is revealed (both partners answered).
 * Updates the relationship's streak: +1 if consecutive day, else reset to 1.
 */
export async function updateStreakOnReveal(
  relationshipId: string,
  sessionDate: Date
): Promise<void> {
  const completedStr = toDateString(sessionDate);
  const yesterdayStr = yesterdayOf(completedStr);

  const existing = await prisma.streak.findUnique({
    where: { relationshipId },
    select: { currentCount: true, longestCount: true, lastCompletedDate: true },
  });

  let newCurrent: number;
  let newLongest: number;

  if (!existing) {
    newCurrent = 1;
    newLongest = 1;
  } else {
    const lastStr = existing.lastCompletedDate
      ? toDateString(existing.lastCompletedDate)
      : null;
    if (lastStr === completedStr) {
      // Same day (e.g. double reveal) — no change
      return;
    }
    if (lastStr === yesterdayStr) {
      newCurrent = existing.currentCount + 1;
      newLongest = Math.max(existing.longestCount, newCurrent);
    } else {
      newCurrent = 1;
      newLongest = existing.longestCount;
    }
  }

  await prisma.streak.upsert({
    where: { relationshipId },
    create: {
      relationshipId,
      currentCount: newCurrent,
      longestCount: newLongest,
      lastCompletedDate: new Date(completedStr + "T12:00:00.000Z"),
    },
    update: {
      currentCount: newCurrent,
      longestCount: newLongest,
      lastCompletedDate: new Date(completedStr + "T12:00:00.000Z"),
    },
  });

  if (isStreakMilestone(newCurrent)) {
    const memberIds = await getActiveMemberIds(relationshipId);
    await Promise.all(memberIds.map((uid) => pushMilestone(uid, newCurrent)));
  }
}
