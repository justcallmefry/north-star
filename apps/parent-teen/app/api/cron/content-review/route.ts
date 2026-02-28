import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

/**
 * Cron endpoint: sends a reminder email to review Aligned content (daily prompts,
 * quiz questions, agreement statements). Schedule in vercel.json (e.g. monthly).
 * Secured by CRON_SECRET. Set CONTENT_REVIEW_EMAIL to the address to notify.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const to = process.env.CONTENT_REVIEW_EMAIL;
  if (!to?.includes("@")) {
    return NextResponse.json(
      { error: "CONTENT_REVIEW_EMAIL not set or invalid" },
      { status: 400 }
    );
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not set" },
      { status: 500 }
    );
  }

  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://alignedconnectingcouples.com";

  const resend = new Resend(resendKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: "Aligned: Time to review your content",
    html: `
      <p>This is a reminder to review your Aligned app content.</p>
      <p>Consider refreshing or adding to:</p>
      <ul>
        <li><strong>Daily prompts</strong> (Today’s question) — prisma/update-daily-prompts.ts, prisma/seed.ts</li>
        <li><strong>Quiz questions</strong> — data/quiz-days.json (30 days × 5 questions)</li>
        <li><strong>Agreement statements</strong> — data/agreement-days.json (30 days × 5 statements)</li>
      </ul>
      <p>App: <a href="${appUrl}">${appUrl}</a></p>
      <p>See docs/CONTENT-UPDATES.md for how to use the AI draft script or update content.</p>
    `,
  });

  if (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
