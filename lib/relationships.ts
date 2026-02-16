"use server";

import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InviteStatus } from "@/generated/prisma";
import crypto from "crypto";

const INVITE_EXPIRY_DAYS = 7;

function generateInviteCode(): string {
  return crypto.randomBytes(8).toString("base64url").slice(0, 12);
}

/** Returns the active membership (leftAt is null) or null. */
async function getActiveMembership(userId: string, relationshipId: string) {
  return prisma.relationshipMember.findFirst({
    where: {
      userId,
      relationshipId,
      leftAt: null,
    },
  });
}

/** Throws if user is not an active member. */
async function requireActiveMember(userId: string, relationshipId: string) {
  const member = await getActiveMembership(userId, relationshipId);
  if (!member) throw new Error("Not a member of this relationship");
  return member;
}

export async function createRelationship(name?: string) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  const userId = session.user.id;
  const code = generateInviteCode();

  const relationship = await prisma.relationship.create({
    data: {
      name: name ?? null,
      status: "active",
      members: {
        create: {
          userId,
          role: "owner",
        },
      },
      invites: {
        create: {
          code,
          invitedBy: userId,
          status: "pending",
          expiresAt: new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        },
      },
    },
    include: {
      invites: { where: { code }, take: 1 },
    },
  });

  const invite = relationship.invites[0];
  revalidatePath("/onboarding");
  revalidatePath("/app");
  return {
    relationshipId: relationship.id,
    inviteCode: invite?.code ?? code,
  };
}

export async function createInvite(relationshipId: string) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  await requireActiveMember(session.user.id, relationshipId);

  const code = generateInviteCode();
  await prisma.invite.create({
    data: {
      code,
      relationshipId,
      invitedBy: session.user.id,
      status: "pending",
      expiresAt: new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  revalidatePath("/invite");
  revalidatePath(`/invite/${relationshipId}`);
  return { code };
}

export async function claimInvite(code: string) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  const trimmed = code.trim();
  const invite = await prisma.invite.findFirst({
    where: { code: { equals: trimmed, mode: "insensitive" } },
    include: { relationship: true },
  });

  if (!invite) throw new Error("Invalid or expired code");
  if (invite.status !== "pending") throw new Error("This invite was already used");
  if (invite.expiresAt && invite.expiresAt < new Date()) throw new Error("This invite has expired");

  const existing = await prisma.relationshipMember.findUnique({
    where: {
      relationshipId_userId: { relationshipId: invite.relationshipId, userId: session.user.id },
    },
  });
  if (existing?.leftAt) throw new Error("You left this relationship; re-join with a new invite.");
  if (existing) return { relationshipId: invite.relationshipId }; // already a member

  await prisma.$transaction([
    prisma.relationshipMember.create({
      data: {
        relationshipId: invite.relationshipId,
        userId: session.user.id,
        role: "member",
      },
    }),
    prisma.invite.update({
      where: { id: invite.id },
      data: {
        status: InviteStatus.accepted,
        claimedBy: session.user.id,
        claimedAt: new Date(),
      },
    }),
  ]);

  revalidatePath("/join");
  revalidatePath("/app");
  return { relationshipId: invite.relationshipId };
}

export async function leaveRelationship(relationshipId: string) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  const member = await prisma.relationshipMember.findFirst({
    where: {
      userId: session.user.id,
      relationshipId,
      leftAt: null,
    },
  });
  if (!member) throw new Error("Not a member of this relationship");

  await prisma.relationshipMember.update({
    where: { id: member.id },
    data: { leftAt: new Date() },
  });

  revalidatePath("/app");
  revalidatePath("/invite");
}

export async function archiveRelationship(relationshipId: string) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  await requireActiveMember(session.user.id, relationshipId);

  await prisma.relationship.update({
    where: { id: relationshipId },
    data: { status: "archived" },
  });

  revalidatePath("/app");
  revalidatePath("/invite");
}

/** List relationships where the user is an active member (for UI). */
export async function getMyActiveRelationships() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return [];

  const members = await prisma.relationshipMember.findMany({
    where: { userId: session.user.id, leftAt: null },
    include: {
      relationship: true,
    },
  });
  return members.map((m) => m.relationship);
}

/** Get latest pending invite for a relationship (for share link). */
export async function getLatestInvite(relationshipId: string) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return null;
  await requireActiveMember(session.user.id, relationshipId);

  const invite = await prisma.invite.findFirst({
    where: {
      relationshipId,
      status: "pending",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
  });
  return invite;
}
