import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_PLATFORMS = new Set(["ios"]);

function validateBody(body: unknown): { token: string; platform: string } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const token = typeof b.token === "string" && b.token.trim() ? b.token.trim() : null;
  const platform = typeof b.platform === "string" ? b.platform : null;
  if (!token || !platform || !ALLOWED_PLATFORMS.has(platform)) return null;
  return { token, platform };
}

/** Registers (or re-homes) a native APNs device token for the current user. */
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
    return NextResponse.json({ error: "Missing or invalid token/platform" }, { status: 400 });
  }

  await prisma.deviceToken.upsert({
    where: { token: parsed.token },
    create: { userId: session.user.id, token: parsed.token, platform: parsed.platform },
    // A token can migrate to a different account (e.g. sign out / sign back in
    // as someone else on the same device) — always re-home to the current user.
    update: { userId: session.user.id, platform: parsed.platform },
  });

  return NextResponse.json({ ok: true });
}
