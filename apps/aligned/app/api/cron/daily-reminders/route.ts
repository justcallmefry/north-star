import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { todayUTC } from "@/lib/relationship-members";
import { Resend } from "resend";

/**
 * Cron endpoint: sends gentle daily reminders when a couple
 * hasn't both answered today's question yet.
 *
 * Schedule in Vercel (or your cron) once per day near your desired reminder time.
 * Secured by CRON_SECRET (same as content-review).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not set" },
      { status: 500 }
    );
  }

  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://alignedconnectingcouples.com";

  const today = todayUTC();

  const sessions = await prisma.dailySession.findMany({
    where: {
      sessionDate: today,
      state: "open",
    },
    include: {
      responses: { select: { userId: true } },
      relationship: {
        select: {
          id: true,
          name: true,
          members: {
            where: { leftAt: null },
            select: { userId: true },
          },
        },
      },
    },
  });

  const resend = new Resend(resendKey);
  let sent = 0;

  for (const s of sessions) {
    const memberIds = s.relationship.members.map((m) => m.userId);
    if (memberIds.length === 0) continue;

    const respondedIds = new Set(s.responses.map((r) => r.userId));
    const allResponded = memberIds.every((id) => respondedIds.has(id));
    if (allResponded) continue;

    const users = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { email: true, name: true },
    });
    const to = users
      .map((u) => u.email)
      .filter((email): email is string => !!email && email.includes("@"));
    if (to.length === 0) continue;

    const subject = "Today's question is up.";
    const link = `${appUrl}/app`;
    const html = `
      <p>Hi there,</p>
      <p>Today&apos;s question is ready on <strong>Aligned</strong>. Whenever you get a chance.</p>
      <p><a href="${link}">Open Aligned</a></p>
      <p style="font-size:13px;color:#64748b;">You can mute email from Aligned from your email client at any time.</p>
    `;

    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (!error) {
      sent += to.length;
    }
  }

  return NextResponse.json({ ok: true, sent });
}

