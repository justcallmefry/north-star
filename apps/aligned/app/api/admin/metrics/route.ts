import { NextResponse } from "next/server";
import { getFunnelMetrics } from "@/lib/metrics";

/**
 * GET /api/admin/metrics
 * The funnel numbers, derived from existing domain data (see lib/metrics.ts).
 * Secured by USAGE_SECRET: send Authorization: Bearer <USAGE_SECRET>.
 *
 * For a browser-readable version, use /app/metrics (gated by ADMIN_EMAIL).
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.USAGE_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret) {
    return NextResponse.json(
      { error: "USAGE_SECRET not configured" },
      { status: 503 }
    );
  }
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const metrics = await getFunnelMetrics();
    return NextResponse.json(metrics, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    console.error("[api/admin/metrics]", err);
    return NextResponse.json(
      { error: "Failed to compute metrics" },
      { status: 500 }
    );
  }
}
