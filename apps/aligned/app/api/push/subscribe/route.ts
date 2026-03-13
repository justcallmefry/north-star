import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function validateBody(body: unknown): { endpoint: string; p256dhKey: string; authKey: string; userAgent?: string } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const endpoint = typeof b.endpoint === "string" ? b.endpoint : null;
  const keys = b.keys && typeof b.keys === "object" ? (b.keys as Record<string, unknown>) : null;
  const p256dh = keys && typeof keys.p256dh === "string" ? keys.p256dh : null;
  const auth = keys && typeof keys.auth === "string" ? keys.auth : null;
  if (!endpoint || !p256dh || !auth) return null;
  const userAgent = typeof b.userAgent === "string" ? b.userAgent : undefined;
  return { endpoint, p256dhKey: p256dh, authKey: auth, userAgent };
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
    return NextResponse.json({ error: "Missing endpoint or keys.p256dh or keys.auth" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.endpoint },
    create: {
      userId: session.user.id,
      endpoint: parsed.endpoint,
      p256dhKey: parsed.p256dhKey,
      authKey: parsed.authKey,
      userAgent: parsed.userAgent,
    },
    update: {
      userId: session.user.id,
      p256dhKey: parsed.p256dhKey,
      authKey: parsed.authKey,
      userAgent: parsed.userAgent,
    },
  });

  return NextResponse.json({ ok: true });
}
