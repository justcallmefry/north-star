"use server";

import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isProfileImageUrl } from "./profile-image";

const ALLOWED_AVATARS = ["❤️", "🧡", "💛", "💚", "💙", "💜", "🤍", "🖤", "💖", "💘"] as const;

const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"] as const;

export async function updateProfile(formData: FormData) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  const rawName = (formData.get("name") as string | null) ?? "";
  const name = rawName.trim();
  const avatar = (formData.get("avatar") as string | null) ?? "";

  const validAvatar =
    avatar && ALLOWED_AVATARS.includes(avatar as (typeof ALLOWED_AVATARS)[number])
      ? avatar
      : null;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name ? { name } : {}),
      // Only set image to emoji when user explicitly chose one; otherwise keep current (e.g. custom photo)
      ...(validAvatar ? { image: validAvatar } : {}),
    },
  });

  revalidatePath("/app/us");
  revalidatePath("/app");
}

export type UploadProfileImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function uploadProfileImage(formData: FormData): Promise<UploadProfileImageResult> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return { ok: false, error: "Not signed in" };

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      ok: false,
      error:
        "Photo upload isn't set up locally. Add BLOB_READ_WRITE_TOKEN to your .env — create a Blob store in your Vercel project (Storage), then run: vercel env pull",
    };
  }

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File) || file.size === 0)
    return { ok: false, error: "Choose a JPG or PNG image (max 2MB)." };

  const type = file.type as string;
  if (!ALLOWED_IMAGE_TYPES.includes(type as (typeof ALLOWED_IMAGE_TYPES)[number]))
    return { ok: false, error: "Only JPG and PNG images are allowed." };
  if (file.size > MAX_PROFILE_IMAGE_BYTES)
    return { ok: false, error: "Image must be 2MB or smaller." };

  const ext = type === "image/png" ? "png" : "jpg";
  const pathname = `profile/${session.user.id}/${Date.now()}.${ext}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: type,
    });

    const previousImage = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });
    if (
      previousImage?.image &&
      isProfileImageUrl(previousImage.image) &&
      previousImage.image.includes("blob.vercel-storage.com")
    ) {
      try {
        await del(previousImage.image);
      } catch {
        // ignore delete errors (e.g. already gone)
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: blob.url },
    });

    revalidatePath("/app/us");
    revalidatePath("/app");
    return { ok: true, url: blob.url };
  } catch (err) {
    console.error("Profile image upload failed:", err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("token") || message.includes("BLOB") || message.includes("Unauthorized")) {
      return {
        ok: false,
        error:
          "Blob storage token missing or invalid. For local dev, add BLOB_READ_WRITE_TOKEN to .env (Vercel → Storage → create Blob store, then: vercel env pull).",
      };
    }
    return { ok: false, error: "Upload failed. Try again or use a smaller image." };
  }
}

export async function removeProfileImage(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return { ok: false, error: "Not signed in" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });
  if (user?.image && isProfileImageUrl(user.image) && user.image.includes("blob.vercel-storage.com")) {
    try {
      await del(user.image);
    } catch {
      // ignore
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: ALLOWED_AVATARS[0] },
  });

  revalidatePath("/app/us");
  revalidatePath("/app");
  return { ok: true };
}

export type PasswordResult = { ok: true } | { ok: false; error: string };

export async function setOrChangePassword(
  currentPassword: string | null,
  newPassword: string
): Promise<PasswordResult> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return { ok: false, error: "Not signed in." };

  const trimmed = newPassword.trim();
  if (trimmed.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user) return { ok: false, error: "User not found." };

  const hasPassword = !!user.password;

  if (hasPassword) {
    if (!currentPassword || !currentPassword.trim()) {
      return { ok: false, error: "Enter your current password." };
    }
    if (!verifyPassword(currentPassword.trim(), user.password!)) {
      return { ok: false, error: "Current password is incorrect." };
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashPassword(trimmed) },
  });

  revalidatePath("/app/us");
  return { ok: true };
}

