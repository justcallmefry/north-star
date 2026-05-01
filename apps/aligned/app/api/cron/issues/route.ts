import { NextResponse } from "next/server";
import { generateAllWeeklyIssues } from "@/lib/issues/generate";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Cron entry point for Issue generation.
 * Vercel calls this hourly on Sundays (see vercel.json). The route also
 * short-circuits on non-Sundays as defense-in-depth.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekly = await generateAllWeeklyIssues(now);

  return NextResponse.json({
    ok: true,
    now: now.toISOString(),
    weekly,
  });
}
