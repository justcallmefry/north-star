import { NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/relationship-members";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Attach a photo to a revealed day. One per partner per day; a new upload
 * replaces your previous one. Stored under day-photos/<userId>/ so account
 * deletion removes it with the rest of that person's uploads.
 */
export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "blob_not_configured" }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad_form" }, { status: 400 });
  }
  const sessionId = form.get("sessionId");
  const file = form.get("file");
  if (typeof sessionId !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });
  if (!ALLOWED_MIME.has(file.type)) return NextResponse.json({ error: "bad_type" }, { status: 415 });

  const day = await prisma.dailySession.findUnique({
    where: { id: sessionId },
    select: { relationshipId: true, state: true },
  });
  if (!day || day.state !== "revealed") return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    await requireActiveMember(session.user.id, day.relationshipId);
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const blob = await put(`day-photos/${session.user.id}/${crypto.randomUUID()}.${ext}`, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type,
  });

  const previous = await prisma.sessionPhoto.findUnique({
    where: { sessionId_userId: { sessionId, userId: session.user.id } },
    select: { url: true },
  });
  await prisma.sessionPhoto.upsert({
    where: { sessionId_userId: { sessionId, userId: session.user.id } },
    create: { sessionId, userId: session.user.id, url: blob.url },
    update: { url: blob.url, createdAt: new Date() },
  });
  if (previous?.url) await del(previous.url).catch(() => {});

  return NextResponse.json({ url: blob.url });
}
