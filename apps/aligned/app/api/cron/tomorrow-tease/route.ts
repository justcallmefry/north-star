import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayUTC } from "@/lib/relationship-members";
import { pickPrompt } from "@/lib/prompt-scheduler";
import { teaserForCategory } from "@/lib/category-teasers";
import { sendPushToUser } from "@/lib/push";

/**
 * Cron endpoint: sends a push to each paired user previewing the *category*
 * of tomorrow's daily prompt — never the question itself. Pure anticipation.
 *
 * Schedule: daily at ~02:00 UTC (≈ 9pm ET / 6pm PT). Single global firing
 * time for v1; per-user timezone delivery is a future enhancement.
 *
 * Secured by CRON_SECRET (same convention as other cron routes).
 */
function toDateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = todayUTC();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowKey = toDateKey(tomorrow);

  // Eligible prompts and recent history needed by the scheduler.
  const [eligibleAll, relationships] = await Promise.all([
    prisma.prompt.findMany({
      where: { active: true, type: "daily", isMilestone: false },
      select: {
        id: true,
        category: true,
        tone: true,
        depthLevel: true,
        funScore: true,
        isMilestone: true,
        weekendOnly: true,
      },
    }),
    prisma.relationship.findMany({
      where: {
        members: { some: { leftAt: null } },
      },
      select: {
        id: true,
        members: {
          where: { leftAt: null },
          select: { userId: true },
        },
      },
    }),
  ]);

  let pushed = 0;
  let skipped = 0;
  let teasedRelationships = 0;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://alignedconnectingcouples.com";

  for (const rel of relationships) {
    const memberIds = rel.members.map((m) => m.userId);
    if (memberIds.length === 0) continue;

    const recentRaw = await prisma.dailySession.findMany({
      where: { relationshipId: rel.id },
      orderBy: { sessionDate: "desc" },
      take: 21,
      select: {
        promptId: true,
        sessionDate: true,
        prompt: { select: { category: true, tone: true, depthLevel: true } },
      },
    });

    const totalCount = await prisma.dailySession.count({
      where: { relationshipId: rel.id },
    });
    const isIntroPhase = totalCount < 7;
    const eligible = isIntroPhase
      ? eligibleAll.filter(
          (p) =>
            p.category != null &&
            ["gratitude", "fun", "reflection", "growth"].includes(p.category) &&
            (p.tone === "light" || p.tone === "playful")
        )
      : eligibleAll;

    const recent = recentRaw.map((r) => ({
      sessionDate: toDateKey(r.sessionDate),
      promptId: r.promptId,
      category: r.prompt?.category ?? null,
      tone: r.prompt?.tone ?? null,
      depthLevel: r.prompt?.depthLevel ?? null,
    }));

    const promptId = pickPrompt({
      relationshipId: rel.id,
      todayKey: tomorrowKey,
      eligible,
      recent,
    });
    if (!promptId) {
      skipped++;
      continue;
    }
    const promptRow = eligible.find((p) => p.id === promptId);
    const teaser = teaserForCategory(promptRow?.category ?? null);

    const payload = {
      title: "Tomorrow on Aligned",
      body: `Tomorrow's question is about ${teaser}.`,
      url: `${appUrl}/app`,
    };

    let any = false;
    for (const userId of memberIds) {
      const sent = await sendPushToUser(userId, payload);
      pushed += sent;
      if (sent > 0) any = true;
    }
    if (any) teasedRelationships++;
  }

  return NextResponse.json({
    ok: true,
    relationships: relationships.length,
    teasedRelationships,
    pushed,
    skipped,
    tomorrowKey,
  });
}
