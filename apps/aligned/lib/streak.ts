"use server";

import { prisma } from "@/lib/prisma";
import { getActiveMemberIds } from "@/lib/relationship-members";
import { sendPushToUser } from "@/lib/push";
import {
  computeStreakUpdate,
  computeStreakView,
  toDateString,
  type StreakRow,
  type StreakView,
} from "@/lib/streak-core";

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

function isStreakMilestone(count: number): count is 7 | 30 | 100 | 365 {
  return count === 7 || count === 30 || count === 100 || count === 365;
}

async function pushMilestoneToUser(userId: string, count: number): Promise<void> {
  const copy = MILESTONE_COPY[count];
  if (!copy) return;
  try {
    await sendPushToUser(userId, { title: copy.title, body: copy.body, url: "/app" });
  } catch (err) {
    console.error("[streak-milestone] push failed:", err);
  }
}

export type StreakInfo = StreakView;

function toRow(row: {
  currentCount: number;
  longestCount: number;
  lastCompletedDate: Date | null;
  graceDays: number;
  graceUsedDate: Date | null;
}): StreakRow {
  return {
    currentCount: row.currentCount,
    longestCount: row.longestCount,
    lastCompletedDate: row.lastCompletedDate ? toDateString(row.lastCompletedDate) : null,
    graceDays: row.graceDays,
    graceUsedDate: row.graceUsedDate ? toDateString(row.graceUsedDate) : null,
  };
}

export async function getStreak(relationshipId: string): Promise<StreakInfo | null> {
  const row = await prisma.streak.findUnique({
    where: { relationshipId },
    select: {
      currentCount: true,
      longestCount: true,
      lastCompletedDate: true,
      graceDays: true,
      graceUsedDate: true,
    },
  });
  if (!row) return null;

  return computeStreakView(toRow(row), toDateString(new Date()));
}

/**
 * Call when a daily session is revealed (both partners answered).
 * Updates the relationship's streak: +1 if consecutive day; a banked
 * Grace Day bridges a single missed day; otherwise reset to 1.
 */
export async function updateStreakOnReveal(
  relationshipId: string,
  sessionDate: Date
): Promise<void> {
  const completedStr = toDateString(sessionDate);

  const existing = await prisma.streak.findUnique({
    where: { relationshipId },
    select: {
      currentCount: true,
      longestCount: true,
      lastCompletedDate: true,
      graceDays: true,
      graceUsedDate: true,
    },
  });

  const next = computeStreakUpdate(existing ? toRow(existing) : null, completedStr);
  if (!next.changed) return;

  const data = {
    currentCount: next.currentCount,
    longestCount: next.longestCount,
    lastCompletedDate: new Date(completedStr + "T12:00:00.000Z"),
    graceDays: next.graceDays,
    graceUsedDate: next.graceUsedDate
      ? new Date(next.graceUsedDate + "T12:00:00.000Z")
      : null,
  };

  await prisma.streak.upsert({
    where: { relationshipId },
    create: { relationshipId, ...data },
    update: data,
  });

  // Milestone push fan-out — runs once per genuine day-crossing increment.
  // The same-day guard in computeStreakUpdate prevents double-fires.
  if (isStreakMilestone(next.currentCount)) {
    try {
      const memberIds = await getActiveMemberIds(relationshipId);
      await Promise.all(memberIds.map((uid) => pushMilestoneToUser(uid, next.currentCount)));
    } catch (err) {
      console.error("[streak-milestone] fan-out failed:", err);
    }
  }
}
