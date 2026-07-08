import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayUTC } from "@/lib/relationship-members";
import { sendPushToUser } from "@/lib/push";
import { Resend } from "resend";

/**
 * Cron endpoint: nudges anyone who hasn't answered today's question.
 * Scheduled in vercel.json daily at 00:00 UTC (~evening in the US).
 *
 * Delivery is push-first (web push + native APNs via sendPushToUser);
 * email is only a fallback for users with no push registration at all.
 * Only non-responders are nudged — a partner who already answered gets
 * nothing.
 *
 * Note: today's DailySession is created lazily when someone opens the
 * app, so we iterate active relationships rather than session rows —
 * otherwise couples where *neither* partner opened the app today (the
 * ones who most need the nudge) would never be reminded.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://alignedconnectingcouples.com";
  const resendKey = process.env.RESEND_API_KEY;
  const resend = resendKey ? new Resend(resendKey) : null;
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

  const today = todayUTC();

  const relationships = await prisma.relationship.findMany({
    where: { status: "active" },
    select: {
      id: true,
      members: { where: { leftAt: null }, select: { userId: true } },
      dailySessions: {
        where: { sessionDate: today },
        select: {
          state: true,
          responses: { select: { userId: true } },
        },
      },
    },
  });

  let pushed = 0;
  let emailed = 0;

  for (const rel of relationships) {
    const memberIds = rel.members.map((m) => m.userId);
    // Solo users are still pairing — the invite flow nudges them, not this.
    if (memberIds.length < 2) continue;

    const session = rel.dailySessions[0] ?? null;
    if (session?.state === "revealed") continue;

    const respondedIds = new Set(session?.responses.map((r) => r.userId) ?? []);
    const pending = memberIds.filter((id) => !respondedIds.has(id));
    if (pending.length === 0) continue;

    const users = await prisma.user.findMany({
      where: { id: { in: pending } },
      select: { id: true, email: true, deletedAt: true },
    });

    const partnerAnswered = respondedIds.size > 0;
    const title = partnerAnswered
      ? "They answered — your turn."
      : "Today's question is up.";
    const body = partnerAnswered
      ? "Their answer is sealed until you write yours."
      : "One question, one minute. Whenever you're ready.";

    for (const user of users) {
      if (user.deletedAt) continue;

      const sent = await sendPushToUser(user.id, { title, body, url: "/app" });
      if (sent > 0) {
        pushed++;
        continue;
      }

      // No push registration on any device — fall back to email.
      if (!resend || !user.email || !user.email.includes("@")) continue;
      const { error } = await resend.emails.send({
        from,
        to: [user.email],
        subject: title,
        html: `
          <p>${body}</p>
          <p><a href="${appUrl}/app">Open Aligned</a></p>
          <p style="font-size:13px;color:#64748b;">You can mute email from Aligned from your email client at any time.</p>
        `,
      });
      if (!error) emailed++;
    }
  }

  return NextResponse.json({ ok: true, pushed, emailed });
}
