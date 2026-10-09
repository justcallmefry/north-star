import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { requireActiveMember } from "@/lib/relationship-members";
import { getPartnerUserId, sendPushToUser } from "@/lib/push";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_TITLE = 80;
const MAX_BODY = 180;

type NotifyBody = { relationshipId: string; title: string; body?: string; url: string };

/**
 * Validate the request, and keep the link in-app.
 *
 * The URL used to be passed through as given, so one partner could push the
 * other a notification that opened any website. Only same-site paths are
 * accepted now; the origin is added server-side.
 */
function validateBody(body: unknown): NotifyBody | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const relationshipId = typeof b.relationshipId === "string" ? b.relationshipId : null;
  const title = typeof b.title === "string" ? b.title.trim().slice(0, MAX_TITLE) : null;
  const url = typeof b.url === "string" ? b.url.trim() : null;
  if (!relationshipId || !title || !url) return null;
  if (!url.startsWith("/") || url.startsWith("//")) return null;
  const bodyText = typeof b.body === "string" ? b.body.trim().slice(0, MAX_BODY) : undefined;
  return { relationshipId, title, url, body: bodyText };
}

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await rateLimit(`notify-partner:${session.user.id}`, 20, 60 * 60);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "You've sent a lot of nudges. Give them a little time." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = validateBody(body);
  if (!parsed) {
    return NextResponse.json(
      { error: "Missing relationshipId, title or an in-app url" },
      { status: 400 }
    );
  }

  try {
    await requireActiveMember(session.user.id, parsed.relationshipId);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const partnerId = await getPartnerUserId(parsed.relationshipId, session.user.id);
  if (!partnerId) {
    return NextResponse.json({ error: "No partner found" }, { status: 400 });
  }

  const sent = await sendPushToUser(partnerId, {
    title: parsed.title,
    body: parsed.body,
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}${parsed.url}`,
  });

  return NextResponse.json({ ok: true, sent });
}
