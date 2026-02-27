import { NextResponse } from "next/server";
import { getUsageStats } from "@/lib/usage";

/**
 * GET /api/admin/usage
 * Returns usage stats for a given date (default: today UTC).
 * Secured by USAGE_SECRET: send Authorization: Bearer <USAGE_SECRET>.
 *
 * Query:
 *   date=YYYY-MM-DD  optional; defaults to today UTC
 */
export async function GET(request: Request) {
  const secret = process.env.USAGE_SECRET;
  const authHeader = request.headers.get("authorization");
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!secret) {
    return NextResponse.json(
      { error: "USAGE_SECRET not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  let forDate: Date | undefined;
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    forDate = new Date(dateParam + "T00:00:00.000Z");
  }

  try {
    const stats = await getUsageStats(forDate);
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    console.error("[api/admin/usage]", err);
    return NextResponse.json(
      { error: "Failed to compute usage stats" },
      { status: 500 }
    );
  }
}
