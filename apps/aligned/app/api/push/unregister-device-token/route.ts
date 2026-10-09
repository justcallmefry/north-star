import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Removes this device's APNs token from the signed-in account. Called just
 * before sign-out so the next person to use the phone does not receive the
 * previous account's notifications. Only deletes a token that belongs to
 * the caller.
 */
export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let token: string | null = null;
  try {
    const body = (await req.json()) as { token?: unknown };
    token = typeof body.token === "string" && body.token.trim() ? body.token.trim() : null;
  } catch {
    token = null;
  }
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const { count } = await prisma.deviceToken.deleteMany({
    where: { token, userId: session.user.id },
  });
  return NextResponse.json({ ok: true, removed: count });
}
