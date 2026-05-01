"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { requireActiveMember } from "@/lib/relationship-members";
import { getPartnerUserId, sendPushToUser } from "@/lib/push";

export type SessionRevealSnapshot = {
  kind: "session_reveal";
  promptText: string | null;
  momentText: string | null;
  sessionDate: string; // ISO date
  responses: Array<{ userId: string; name: string | null; content: string | null }>;
};

export type AppreciationSnapshot = {
  kind: "appreciation";
  fromUserId: string;
  fromName: string | null;
  message: string;
};

export type MemorySnapshot = SessionRevealSnapshot | AppreciationSnapshot;

export type MemoryListItem = {
  id: string;
  sourceType: string;
  savedAt: string;
  snapshot: MemorySnapshot;
};

/** Save a session reveal as a memory. Idempotent per (sessionId, savedByUserId). */
export async function saveSessionReveal(sessionId: string): Promise<void> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const ds = await prisma.dailySession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      relationshipId: true,
      sessionDate: true,
      state: true,
      prompt: { select: { text: true, momentText: true } },
      responses: {
        select: {
          userId: true,
          content: true,
          user: { select: { name: true } },
        },
      },
    },
  });
  if (!ds) throw new Error("Session not found");
  if (ds.state !== "revealed") throw new Error("Memory can only be saved after reveal");
  await requireActiveMember(userId, ds.relationshipId);

  // Idempotent: dedupe by (sourceType, sourceId, savedByUserId)
  const existing = await prisma.memory.findFirst({
    where: {
      sourceType: "session_reveal",
      sourceId: ds.id,
      savedByUserId: userId,
    },
    select: { id: true },
  });
  if (existing) return;

  const snapshot: SessionRevealSnapshot = {
    kind: "session_reveal",
    promptText: ds.prompt?.text ?? null,
    momentText: ds.prompt?.momentText ?? null,
    sessionDate: ds.sessionDate.toISOString().slice(0, 10),
    responses: ds.responses.map((r) => ({
      userId: r.userId,
      name: r.user?.name ?? null,
      content: r.content,
    })),
  };

  await prisma.memory.create({
    data: {
      relationshipId: ds.relationshipId,
      savedByUserId: userId,
      sourceType: "session_reveal",
      sourceId: ds.id,
      // JSON shape isn't typed by Prisma; cast through unknown.
      snapshot: snapshot as unknown as object,
    },
  });

  revalidatePath("/app/memories");
}

/** Save a one-off appreciation note as a memory. */
export async function saveAppreciation(
  relationshipId: string,
  message: string
): Promise<void> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const trimmed = message.trim();
  if (!trimmed) throw new Error("Message is empty");
  if (trimmed.length > 280) throw new Error("Message is too long");

  await requireActiveMember(userId, relationshipId);

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const snapshot: AppreciationSnapshot = {
    kind: "appreciation",
    fromUserId: userId,
    fromName: me?.name ?? null,
    message: trimmed,
  };

  await prisma.memory.create({
    data: {
      relationshipId,
      savedByUserId: userId,
      sourceType: "appreciation",
      sourceId: null,
      snapshot: snapshot as unknown as object,
    },
  });

  // Notify the partner — non-fatal: a failed push must never fail the save.
  try {
    const partnerId = await getPartnerUserId(relationshipId, userId);
    if (partnerId) {
      const senderFirstName = me?.name?.split(" ")[0] ?? null;
      await sendPushToUser(partnerId, {
        title: senderFirstName
          ? `${senderFirstName} left you something.`
          : "They left you something.",
        body: "From them, for you.",
        url: "/app/memories",
      });
    }
  } catch (err) {
    console.error("[appreciation] push send failed:", err);
  }

  revalidatePath("/app/memories");
}

/** List memories for the user's primary relationship, newest first. */
export async function listMemoriesForRelationship(
  relationshipId: string
): Promise<MemoryListItem[]> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await requireActiveMember(session.user.id, relationshipId);

  const rows = await prisma.memory.findMany({
    where: { relationshipId },
    orderBy: { savedAt: "desc" },
    select: { id: true, sourceType: true, savedAt: true, snapshot: true },
  });

  return rows.map((r) => ({
    id: r.id,
    sourceType: r.sourceType,
    savedAt: r.savedAt.toISOString(),
    snapshot: r.snapshot as unknown as MemorySnapshot,
  }));
}

/** Delete a memory the user saved. Anyone in the relationship can delete. */
export async function deleteMemory(memoryId: string): Promise<void> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const m = await prisma.memory.findUnique({
    where: { id: memoryId },
    select: { id: true, relationshipId: true },
  });
  if (!m) return;
  await requireActiveMember(userId, m.relationshipId);
  await prisma.memory.delete({ where: { id: memoryId } });
  revalidatePath("/app/memories");
}

/** True if the user has already saved this session as a memory. */
export async function hasSavedSessionAsMemory(sessionId: string): Promise<boolean> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return false;
  const existing = await prisma.memory.findFirst({
    where: {
      sourceType: "session_reveal",
      sourceId: sessionId,
      savedByUserId: session.user.id,
    },
    select: { id: true },
  });
  return !!existing;
}
