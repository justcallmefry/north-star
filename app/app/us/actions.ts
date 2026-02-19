"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";

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

