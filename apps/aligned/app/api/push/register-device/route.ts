import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function validateBody(body: unknown): { token: string; platform: string } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const token = typeof b.token === "string" ? b.token.trim() : null;
  const platform = typeof b.platform === "string" ? b.platform.trim().toLowerCase() : null;
  if (!token || !platform) return null;
  if (platform !== "ios" && platform !== "android") return null;
  return { token, platform };
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
    return NextResponse.json(
      { error: "Missing or invalid token or platform (use 'ios' or 'android')" },
      { status: 400 }
    );
  }

  await prisma.nativePushToken.upsert({
    where: { token: parsed.token },
    create: {
      userId: session.user.id,
      token: parsed.token,
      platform: parsed.platform,
    },
    update: {
      userId: session.user.id,
      platform: parsed.platform,
    },
  });

  return NextResponse.json({ ok: true });
}
