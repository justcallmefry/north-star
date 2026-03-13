import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { requireActiveMember } from "@/lib/relationship-members";
import { getPartnerUserId, sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

function validateBody(body: unknown): { relationshipId: string; title: string; body?: string; url: string } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const relationshipId = typeof b.relationshipId === "string" ? b.relationshipId : null;
  const title = typeof b.title === "string" ? b.title : null;
  const url = typeof b.url === "string" ? b.url : null;
  if (!relationshipId || !title || !url) return null;
  const bodyText = typeof b.body === "string" ? b.body : undefined;
  return { relationshipId, title, url, body: bodyText };
}

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = validateBody(body);
  if (!parsed) {
    return NextResponse.json({ error: "Missing relationshipId, title, or url" }, { status: 400 });
  }

  await requireActiveMember(session.user.id, parsed.relationshipId);
  const partnerId = await getPartnerUserId(parsed.relationshipId, session.user.id);
  if (!partnerId) {
    return NextResponse.json({ error: "No partner found" }, { status: 400 });
  }

  const sent = await sendPushToUser(partnerId, {
    title: parsed.title,
    body: parsed.body,
    url: parsed.url.startsWith("http") ? parsed.url : `${process.env.NEXT_PUBLIC_APP_URL ?? ""}${parsed.url}`,
  });

  return NextResponse.json({ ok: true, sent });
}
