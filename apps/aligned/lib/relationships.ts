"use server";

import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/relationship-members";
import { InviteStatus, Prisma } from "@/generated/prisma";
import { trackEvent } from "@/lib/events";
import { notifyPartnerJoined } from "@/lib/partner-loop";
import { rateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

const INVITE_EXPIRY_DAYS = 7;

/**
 * A relationship is a couple: exactly two active members. The schema used
 * to allow three, and outstanding invite codes stayed valid after pairing,
 * so anyone holding an old code could join an existing couple and read
 * every answer, memory and magazine issue they had ever written.
 */
const MAX_MEMBERS = 2;

/**
 * Uppercase letters and digits minus look-alikes (0/O, 1/I/L), so a code
 * read aloud or copied from a screenshot survives. 12 characters from 31
 * symbols is about 59 bits.
 *
 * Base64url was used before, but its alphabet includes "-", and the pair
 * screen formats codes as XXXX-XXXX-XXXX by stripping dashes first — so
 * roughly one code in six was displayed wrongly. With no "-" in the
 * alphabet, dashes on input are always formatting and safe to remove.
 */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < 12; i++) code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  return code;
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

  const members = await prisma.relationshipMember.count({
    where: { relationshipId, leftAt: null },
  });
  if (members >= MAX_MEMBERS) throw new Error("You're already paired.");

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

export type ClaimInviteResult =
  | { ok: true; relationshipId: string }
  | { ok: false; error: string };

/**
 * Join the couple an invite code belongs to.
 *
 * Returns a result rather than throwing: Next.js redacts thrown server-action
 * messages in production, so "This invite has expired" reached people as a
 * generic error.
 */
export async function claimInvite(code: string): Promise<ClaimInviteResult> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return { ok: false, error: "Sign in first, then open the invite again." };
  const userId = session.user.id;

  // Codes carry ~58 bits of entropy, but there is no reason to allow guessing.
  const limited = await rateLimit(`invite-claim:${userId}`, 10, 60 * 60);
  if (!limited.ok) return { ok: false, error: "Too many attempts. Try again in a little while." };

  const trimmed = code.trim().replace(/[\s-]/g, "");
  if (!trimmed) return { ok: false, error: "Enter the code from your partner's invite." };

  const invite = await prisma.invite.findFirst({
    where: { code: { equals: trimmed, mode: "insensitive" } },
    include: { relationship: true },
  });

  if (!invite) return { ok: false, error: "That code isn't valid. Check it and try again." };
  if (invite.relationship.status !== "active") {
    return { ok: false, error: "This invite is no longer active. Ask your partner for a new one." };
  }
  if (invite.status !== "pending") {
    return { ok: false, error: "This invite has already been used. Ask your partner for a new one." };
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return { ok: false, error: "This invite has expired. Ask your partner for a new one." };
  }

  const existing = await prisma.relationshipMember.findUnique({
    where: {
      relationshipId_userId: { relationshipId: invite.relationshipId, userId },
    },
  });
  if (existing?.leftAt) {
    return { ok: false, error: "You left this relationship. Ask your partner for a new invite." };
  }
  if (existing) return { ok: true, relationshipId: invite.relationshipId };

  try {
    // Count and join inside one serializable transaction so two people
    // redeeming codes at the same moment cannot both get in.
    await prisma.$transaction(
      async (tx) => {
        const members = await tx.relationshipMember.count({
          where: { relationshipId: invite.relationshipId, leftAt: null },
        });
        if (members >= MAX_MEMBERS) throw new CoupleCompleteError();

        await tx.relationshipMember.create({
          data: { relationshipId: invite.relationshipId, userId, role: "member" },
        });
        await tx.invite.update({
          where: { id: invite.id },
          data: { status: InviteStatus.accepted, claimedBy: userId, claimedAt: new Date() },
        });
        // Once the couple is complete, every other outstanding code is dead.
        await tx.invite.updateMany({
          where: { relationshipId: invite.relationshipId, status: InviteStatus.pending },
          data: { status: InviteStatus.expired },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (err) {
    if (err instanceof CoupleCompleteError) {
      return { ok: false, error: "This couple is already complete. Ask for a new invite if you meant to start your own." };
    }
    console.error("[claimInvite] failed:", err);
    return { ok: false, error: "Couldn't join just now. Try again in a moment." };
  }

  void trackEvent("paired", { userId, relationshipId: invite.relationshipId });

  // Tell whoever sent the invite that their partner actually arrived.
  void notifyPartnerJoined(invite.relationshipId, userId);

  revalidatePath("/join");
  revalidatePath("/app");
  return { ok: true, relationshipId: invite.relationshipId };
}

class CoupleCompleteError extends Error {}

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

/** List relationships where the given user is an active member (for API/route handlers that already have userId). */
export async function getActiveRelationshipsForUser(userId: string) {
  // This module is "use server" (the client calls claimInvite and friends),
  // so this export is a public endpoint. Only answer for the caller.
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.id !== userId) return [];

  const members = await prisma.relationshipMember.findMany({
    where: { userId, leftAt: null },
    include: {
      relationship: true,
    },
  });
  return members.map((m) => m.relationship);
}

/** List relationships where the user is an active member (for UI). */
export async function getMyActiveRelationships() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return [];

  return getActiveRelationshipsForUser(session.user.id);
}

/** Set or clear the anniversary date for a relationship (member-only). */
export async function setAnniversaryDate(
  relationshipId: string,
  dateStr: string | null
): Promise<void> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const member = await prisma.relationshipMember.findFirst({
    where: { relationshipId, userId: session.user.id, leftAt: null },
    select: { id: true },
  });
  if (!member) throw new Error("Not a member of this relationship");

  let value: Date | null = null;
  if (dateStr) {
    // Parse YYYY-MM-DD as a local date (no time). Reject anything else.
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!m) throw new Error("Invalid date");
    const [, y, mo, d] = m;
    value = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
    if (Number.isNaN(value.getTime())) throw new Error("Invalid date");
    if (value.getTime() > Date.now() + 86_400_000) {
      throw new Error("That date is in the future");
    }
  }

  await prisma.relationship.update({
    where: { id: relationshipId },
    data: { anniversaryDate: value },
  });

  revalidatePath("/app");
  revalidatePath("/app/us");
  revalidatePath("/app/us/relationship");
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
