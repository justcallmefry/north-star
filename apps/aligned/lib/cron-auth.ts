import { NextResponse } from "next/server";

/**
 * Shared guard for /api/cron/* routes.
 *
 * Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` when the variable
 * is set. The routes used to skip the check entirely when CRON_SECRET was
 * unset — which it was — so anyone could trigger a reminder pass or a
 * magazine run with a plain GET. A missing secret now refuses the request.
 *
 * Returns a response to send back when the caller is not allowed, else null.
 */
export function rejectUnlessCron(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
