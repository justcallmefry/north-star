"use server";

import { prisma } from "@/lib/prisma";

/**
 * Soft-delete the current user. Anonymizes personal fields, hard-deletes
 * auth artifacts and devices, marks relationship memberships as left, and
 * cancels active subscriptions. Partner-visible content (responses,
 * reactions, meeting entries) stays attached to this row by id with no
 * personal info, so the partner's history isn't destroyed.
 *
 * App Store / GDPR-compliant: the personal data is removed; what remains
 * is jointly-authored content the other party also has rights to.
 */
export async function deleteOwnAccount(userId: string): Promise<void> {
  if (!userId) throw new Error("No user id");

  const now = new Date();
  // Tombstone email keeps the User.email unique constraint satisfied while
  // preventing any future sign-in attempt from matching the original address.
  const tombstoneEmail = `deleted-${userId}@deleted.local`;

  await prisma.$transaction(async (tx) => {
    // 1. Auth artifacts — hard delete so the user can't return to the session.
    await tx.session.deleteMany({ where: { userId } });
    await tx.account.deleteMany({ where: { userId } });

    // 2. Devices — push subs are device-specific identifiers; remove them.
    await tx.pushSubscription.deleteMany({ where: { userId } });

    // 3. Subscriptions — mark canceled. (Stripe-side cancellation is a
    //    follow-up once StoreKit/Billing is wired; this just stops UI access.)
    await tx.subscription.updateMany({
      where: { userId, status: { in: ["active", "trialing"] } },
      data: { status: "canceled", cancelAtPeriodEnd: true, updatedAt: now },
    });

    // 4. Relationships — mark this user as left in every active membership.
    //    The partner keeps the relationship with our soft-deleted account
    //    visible in shared history but not as an active member.
    await tx.relationshipMember.updateMany({
      where: { userId, leftAt: null },
      data: { leftAt: now },
    });

    // 5. Anonymize the User row last, after dependent rows are settled.
    await tx.user.update({
      where: { id: userId },
      data: {
        email: tombstoneEmail,
        emailVerified: null,
        name: null,
        image: null,
        password: null,
        deletedAt: now,
      },
    });
  });
}

export type ExportedData = {
  exportedAt: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    createdAt: string;
  };
  relationships: Array<{
    id: string;
    name: string | null;
    joinedAt: string | null;
    leftAt: string | null;
  }>;
  responses: Array<{
    sessionId: string;
    sessionDate: string;
    promptText: string | null;
    content: string | null;
    createdAt: string;
  }>;
  reflections: Array<{
    sessionId: string;
    content: string | null;
    reaction: string | null;
    createdAt: string;
  }>;
  meetingEntries: Array<{
    meetingId: string;
    weekKey: string;
    wins: string | null;
    stressors: string | null;
    request: string | null;
    plan: string | null;
    appreciation: string | null;
    updatedAt: string;
  }>;
};

/**
 * Returns a JSON-serializable snapshot of the user's own data. Excludes
 * partner-authored content (we only export what the user has rights to).
 */
export async function exportOwnData(userId: string): Promise<ExportedData> {
  if (!userId) throw new Error("No user id");

  const [user, memberships, responses, reflections, meetingEntries] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, image: true, createdAt: true },
    }),
    prisma.relationshipMember.findMany({
      where: { userId },
      select: {
        joinedAt: true,
        leftAt: true,
        relationship: { select: { id: true, name: true } },
      },
    }),
    prisma.response.findMany({
      where: { userId },
      select: {
        sessionId: true,
        content: true,
        createdAt: true,
        session: {
          select: {
            sessionDate: true,
            prompt: { select: { text: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reflection.findMany({
      where: { userId },
      select: {
        sessionId: true,
        content: true,
        reaction: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.meetingEntry.findMany({
      where: { userId },
      select: {
        meetingId: true,
        wins: true,
        stressors: true,
        request: true,
        plan: true,
        appreciation: true,
        updatedAt: true,
        meeting: { select: { weekKey: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  if (!user) throw new Error("User not found");

  return {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      createdAt: user.createdAt.toISOString(),
    },
    relationships: memberships.map((m) => ({
      id: m.relationship.id,
      name: m.relationship.name,
      joinedAt: m.joinedAt?.toISOString() ?? null,
      leftAt: m.leftAt?.toISOString() ?? null,
    })),
    responses: responses.map((r) => ({
      sessionId: r.sessionId,
      sessionDate: r.session.sessionDate.toISOString(),
      promptText: r.session.prompt?.text ?? null,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
    })),
    reflections: reflections.map((r) => ({
      sessionId: r.sessionId,
      content: r.content,
      reaction: r.reaction,
      createdAt: r.createdAt.toISOString(),
    })),
    meetingEntries: meetingEntries.map((m) => ({
      meetingId: m.meetingId,
      weekKey: m.meeting.weekKey,
      wins: m.wins,
      stressors: m.stressors,
      request: m.request,
      plan: m.plan,
      appreciation: m.appreciation,
      updatedAt: m.updatedAt.toISOString(),
    })),
  };
}
