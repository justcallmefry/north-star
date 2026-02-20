"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

const ALLOWED_AVATARS = ["❤️", "🧡", "💛", "💚", "💙", "💜", "🤍", "🖤", "💖", "💘"] as const;

export async function updateProfile(formData: FormData) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  const rawName = (formData.get("name") as string | null) ?? "";
  const name = rawName.trim();
  const avatar = (formData.get("avatar") as string | null) ?? "";

  const validAvatar =
    avatar && ALLOWED_AVATARS.includes(avatar as (typeof ALLOWED_AVATARS)[number])
      ? avatar
      : ALLOWED_AVATARS[0];

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name ? { name } : {}),
      image: validAvatar,
    },
  });

  revalidatePath("/app/us");
  revalidatePath("/app");
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

