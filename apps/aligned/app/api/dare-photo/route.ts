import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerAuthSession } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Photo upload isn't configured. Add BLOB_READ_WRITE_TOKEN to your environment (Vercel → Storage → create Blob store, then: vercel env pull).",
      },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "bad_type" }, { status: 415 });
  }

  // Use a server-generated filename — never trust the client filename.
  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key = `dare-photos/${session.user.id}/${crypto.randomUUID()}.${ext}`;

  try {
    const blob = await put(key, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Dare photo upload failed:", err);
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("token") ||
      message.includes("BLOB") ||
      message.includes("Unauthorized")
    ) {
      return NextResponse.json(
        {
          error:
            "Blob storage token missing or invalid. Add BLOB_READ_WRITE_TOKEN to your .env (vercel env pull).",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
