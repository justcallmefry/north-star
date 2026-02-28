import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { requireActiveMember } from "@/lib/relationship-members";
import {
  CURRENT_RELATIONSHIP_COOKIE_NAME,
  CURRENT_RELATIONSHIP_COOKIE_MAX_AGE,
} from "@/lib/current-relationship";

/**
 * POST body: { relationshipId: string }
 * Sets the "current relationship" cookie so the user can switch between two parents (one login, dual context).
 */
export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { relationshipId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const relationshipId = body?.relationshipId;
  if (typeof relationshipId !== "string" || !relationshipId) {
    return NextResponse.json({ error: "relationshipId required" }, { status: 400 });
  }

  try {
    await requireActiveMember(session.user.id, relationshipId);
  } catch {
    return NextResponse.json({ error: "Not a member of this relationship" }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(CURRENT_RELATIONSHIP_COOKIE_NAME, relationshipId, {
    path: "/",
    maxAge: CURRENT_RELATIONSHIP_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
