"use server";

import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveMemberIds, requireActiveMember, todayUTC } from "@/lib/relationship-members";
import { VALIDATION_ACK_MAX_LENGTH, VALIDATION_ALLOWED_EMOJIS } from "@north-star/shared";

/** Verify user is active member of the session's relationship. Returns minimal session (no sensitive includes). */
async function requireSessionMembership(userId: string, sessionId: string) {
  const session = await prisma.dailySession.findUnique({
    where: { id: sessionId },
    select: { id: true, relationshipId: true, state: true, sessionDate: true, promptId: true },
  });
  if (!session) throw new Error("Session not found");
  await requireActiveMember(userId, session.relationshipId);
  return session;
}

/** Pick a prompt not used in the last 7 sessions for this relationship. */
async function pickPromptForSession(relationshipId: string): Promise<string | null> {
  const recent = await prisma.dailySession.findMany({
    where: { relationshipId },
    orderBy: { sessionDate: "desc" },
    take: 7,
    select: { promptId: true },
  });
  const usedIds = recent.map((s) => s.promptId).filter(Boolean) as string[];
  let prompt = await prisma.prompt.findFirst({
    where: {
      active: true,
      type: "daily",
      // later: isPremium: false if not subscribed
      id: usedIds.length > 0 ? { notIn: usedIds } : undefined,
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!prompt) {
    prompt = await prisma.prompt.findFirst({
      where: { active: true, type: "daily" },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
  }
  return prompt?.id ?? null;
}

export type GetTodayResult = {
  sessionId: string;
  promptText: string;
  momentText?: string | null;
  state: "open" | "revealed" | "expired";
  hasUserResponded: boolean;
  hasPartnerResponded: boolean;
  canReveal: boolean;
};

/**
 * Get today's session for a relationship.
 * @param relationshipId - Relationship to get session for.
 * @param localDateStr - Optional "YYYY-MM-DD" from the user's local timezone (e.g. from the browser).
 *   When provided, "today" is this date (midnight UTC for that calendar day), so the new question
 *   appears at midnight in their local area. When omitted, uses midnight UTC.
 */
export async function getToday(
  relationshipId: string,
  localDateStr?: string
): Promise<GetTodayResult | null> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  await requireActiveMember(session.user.id, relationshipId);
  const memberIds = await getActiveMemberIds(relationshipId);
  if (memberIds.length === 0) return null;
  const exactlyTwo = memberIds.length === 2;

  // Use local date when provided (midnight in their area = this calendar day in UTC for lookup).
  const today =
    localDateStr && /^\d{4}-\d{2}-\d{2}$/.test(localDateStr)
      ? new Date(localDateStr + "T00:00:00.000Z")
      : todayUTC();

  // Don't advance to a new question until the current one is done (revealed or expired).
  // So if the most recent session is still open, show that; otherwise use/create today's.
  const latestSession = await prisma.dailySession.findFirst({
    where: { relationshipId },
    orderBy: { sessionDate: "desc" },
    include: {
      prompt: true,
      responses: { select: { userId: true, content: true } },
    },
  });

  let dailySession: typeof latestSession;
  if (!latestSession) {
    const promptId = await pickPromptForSession(relationshipId);
    dailySession = await prisma.dailySession.create({
      data: {
        relationshipId,
        sessionDate: today,
        promptId,
        state: "open",
      },
      include: {
        prompt: true,
        responses: { select: { userId: true, content: true } },
      },
    });
  } else if (latestSession.state === "open" || latestSession.state === "expired") {
    const todayStr = localDateStr && /^\d{4}-\d{2}-\d{2}$/.test(localDateStr) ? localDateStr : today.toISOString().slice(0, 10);
    const latestDateStr = latestSession.sessionDate.toISOString().slice(0, 10);
    if (latestDateStr === todayStr) {
      dailySession = latestSession;
    } else {
      dailySession = await prisma.dailySession.findUnique({
        where: {
          relationshipId_sessionDate: { relationshipId, sessionDate: today },
        },
        include: {
          prompt: true,
          responses: { select: { userId: true, content: true } },
        },
      });
      if (!dailySession) {
        const promptId = await pickPromptForSession(relationshipId);
        dailySession = await prisma.dailySession.create({
          data: {
            relationshipId,
            sessionDate: today,
            promptId,
            state: "open",
          },
          include: {
            prompt: true,
            responses: { select: { userId: true, content: true } },
          },
        });
      }
    }
  } else {
    // Latest is revealed — show today's session, creating if needed
    dailySession = await prisma.dailySession.findUnique({
      where: {
        relationshipId_sessionDate: { relationshipId, sessionDate: today },
      },
      include: {
        prompt: true,
        responses: { select: { userId: true, content: true } },
      },
    });
    if (!dailySession) {
      const promptId = await pickPromptForSession(relationshipId);
      dailySession = await prisma.dailySession.create({
        data: {
          relationshipId,
          sessionDate: today,
          promptId,
          state: "open",
        },
        include: {
          prompt: true,
          responses: { select: { userId: true, content: true } },
        },
      });
    }
  }

  const promptText = dailySession.prompt?.text ?? "How are you feeling right now?";
  const momentText = dailySession.prompt?.momentText ?? null;
  const hasUserResponded = dailySession.responses.some((r) => r.userId === session.user!.id);
  const partnerIds = memberIds.filter((id) => id !== session.user!.id);
  const hasPartnerResponded =
    exactlyTwo &&
    (partnerIds.length === 0 ||
      partnerIds.every((id) => dailySession!.responses.some((r) => r.userId === id)));
  const canReveal =
    exactlyTwo &&
    dailySession.state === "open" &&
    hasUserResponded &&
    hasPartnerResponded;

  return {
    sessionId: dailySession.id,
    promptText,
    momentText,
    state: dailySession.state as "open" | "revealed" | "expired",
    hasUserResponded,
    hasPartnerResponded,
    canReveal,
  };
}

export async function submitResponse(sessionId: string, text: string) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  const dailySession = await requireSessionMembership(session.user.id, sessionId);

  await prisma.response.upsert({
    where: {
      sessionId_userId: { sessionId, userId: session.user.id },
    },
    create: {
      sessionId,
      userId: session.user.id,
      content: text,
    },
    update: { content: text },
  });

  revalidatePath("/app");
  revalidatePath(`/app/session/${sessionId}`);
  return {
    hasUserResponded: true,
    state: dailySession.state,
  };
}

export type RevealResult = {
  promptText: string;
  responses: { userId: string; content: string | null }[];
  reflections: { userId: string; content: string | null; reaction: string | null }[];
};

export async function revealSession(sessionId: string): Promise<RevealResult> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  const base = await requireSessionMembership(session.user.id, sessionId);
  const memberIds = await getActiveMemberIds(base.relationshipId);
  if (memberIds.length !== 2)
    throw new Error("This relationship must have exactly 2 active members.");
  const withResponses = await prisma.dailySession.findUnique({
    where: { id: sessionId },
    include: { responses: { select: { userId: true } } },
  });
  const bothResponded =
    memberIds.length >= 2 &&
    withResponses &&
    memberIds.every((id) => withResponses.responses.some((r) => r.userId === id));
  if (!bothResponded) throw new Error("Both partners must respond before revealing");

  await prisma.dailySession.update({
    where: { id: sessionId },
    data: { state: "revealed" },
  });

  const updated = await prisma.dailySession.findUnique({
    where: { id: sessionId },
    include: {
      prompt: true,
      responses: { select: { userId: true, content: true } },
      reflections: { select: { userId: true, content: true, reaction: true } },
    },
  });

  revalidatePath("/app");
  revalidatePath(`/app/session/${sessionId}`);

  return {
    promptText: updated?.prompt?.text ?? "",
    responses: updated?.responses ?? [],
    reflections: updated?.reflections ?? [],
  };
}

export type GetSessionResult = {
  sessionId: string;
  relationshipId: string;
  sessionDate: Date;
  promptText: string;
  momentText?: string | null;
  state: string;
  userResponse: string | null;
  hasUserResponded: boolean;
  hasPartnerResponded: boolean | null;
  canReveal: boolean;
  partnerResponse?: string | null;
  reflections?: { userId: string; content: string | null; reaction: string | null }[];
  /** Display name for current user (for "Chris' response") */
  currentUserName?: string | null;
  currentUserImage?: string | null;
  /** Partner display name and icon */
  partnerName?: string | null;
  partnerImage?: string | null;
};

export async function getSession(sessionId: string): Promise<GetSessionResult | null> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  // Membership-first: no sensitive data until we know user belongs
  await requireSessionMembership(session.user.id, sessionId);

  const dailySession = await prisma.dailySession.findUnique({
    where: { id: sessionId },
    include: {
      prompt: true,
      responses: true,
      reflections: true,
    },
  });
  if (!dailySession) return null;

  const memberIds = await getActiveMemberIds(dailySession.relationshipId);
  const userResponse = dailySession.responses.find((r) => r.userId === session.user!.id);
  const partnerIds = memberIds.filter((id) => id !== session.user!.id);
  const hasPartnerResponded =
    partnerIds.length === 0 ||
    partnerIds.every((id) => dailySession.responses.some((r) => r.userId === id));
  const exactlyTwo = memberIds.length === 2;
  const canReveal =
    exactlyTwo &&
    dailySession.state === "open" &&
    !!userResponse &&
    hasPartnerResponded;

  const result: GetSessionResult = {
    sessionId: dailySession.id,
    relationshipId: dailySession.relationshipId,
    sessionDate: dailySession.sessionDate,
    promptText: dailySession.prompt?.text ?? "",
    momentText: dailySession.prompt?.momentText ?? null,
    state: dailySession.state,
    userResponse: userResponse?.content ?? null,
    hasUserResponded: !!userResponse,
    hasPartnerResponded: partnerIds.length === 0 ? null : hasPartnerResponded,
    canReveal,
  };

  if (dailySession.state === "revealed") {
    const partner = dailySession.responses.find((r) => r.userId !== session.user!.id);
    result.partnerResponse = partner?.content ?? null;
    result.reflections = dailySession.reflections.map((r) => ({
      userId: r.userId,
      content: r.content,
      reaction: r.reaction,
    }));
    const userIds = [session.user!.id, ...(partner ? [partner.userId] : [])];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true },
    });
    const currentUser = users.find((u) => u.id === session.user!.id);
    const partnerUser = users.find((u) => u.id !== session.user!.id);
    result.currentUserName = currentUser?.name ?? null;
    result.currentUserImage = currentUser?.image ?? null;
    result.partnerName = partnerUser?.name ?? null;
    result.partnerImage = partnerUser?.image ?? null;
  }

  return result;
}

export type HistoryItem = {
  sessionId: string;
  sessionDate: Date;
  promptText: string;
  responses: {
    id: string;
    userId: string;
    content: string | null;
    userName: string | null;
    userImage: string | null;
    validation: { reactions: string | null; acknowledgment: string | null } | null;
  }[];
  reflections: { userId: string; content: string | null; reaction: string | null }[];
};

export async function getHistory(
  relationshipId: string,
  cursor?: string,
  take = 10
): Promise<{ items: HistoryItem[]; nextCursor: string | null }> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  await requireActiveMember(session.user.id, relationshipId);

  const baseOpts = {
    where: { relationshipId, state: "revealed" } as const,
    orderBy: { sessionDate: "desc" as const } as const,
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  };

  type Row = { id: string; userId: string; content: string | null; validations?: { userId: string; reactions: string | null; acknowledgment: string | null }[] };
  let list: { id: string; sessionDate: Date; prompt: { text: string | null } | null; responses: Row[]; reflections: { userId: string; content: string | null; reaction: string | null }[] }[];

  try {
    const sessions = await prisma.dailySession.findMany({
      ...baseOpts,
      include: {
        prompt: true,
        responses: {
          select: {
            id: true,
            userId: true,
            content: true,
            validations: { select: { userId: true, reactions: true, acknowledgment: true } },
          },
        },
        reflections: { select: { userId: true, content: true, reaction: true } },
      },
    });
    list = sessions as typeof list;
  } catch {
    const sessions = await prisma.dailySession.findMany({
      ...baseOpts,
      include: {
        prompt: true,
        responses: { select: { id: true, userId: true, content: true } },
        reflections: { select: { userId: true, content: true, reaction: true } },
      },
    });
    list = sessions.map((s) => ({ ...s, responses: s.responses.map((r) => ({ ...r, validations: [] })) })) as typeof list;
  }

  const hasMore = list.length > take;
  const listSliced = hasMore ? list.slice(0, take) : list;
  const nextCursor = hasMore ? listSliced[listSliced.length - 1].id : null;

  const allUserIds: string[] = [];
  for (const s of listSliced) {
    for (const r of s.responses) {
      if (!allUserIds.includes(r.userId)) allUserIds.push(r.userId);
    }
  }
  const users =
    allUserIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: allUserIds } }, select: { id: true, name: true, image: true } })
      : [];
  const userMap = new Map(users.map((u) => [u.id, { name: u.name, image: u.image }]));

  const items: HistoryItem[] = listSliced.map((s) => ({
    sessionId: s.id,
    sessionDate: s.sessionDate,
    promptText: s.prompt?.text ?? "",
    responses: s.responses.map((r) => {
      const u = userMap.get(r.userId);
      const validations = r.validations ?? [];
      const partnerVal = validations.find((v) => v.userId !== r.userId) ?? null;
      return {
        id: r.id,
        userId: r.userId,
        content: r.content,
        userName: u?.name ?? null,
        userImage: u?.image ?? null,
        validation: partnerVal ? { reactions: partnerVal.reactions, acknowledgment: partnerVal.acknowledgment } : null,
      };
    }),
    reflections: s.reflections.map((r) => ({ userId: r.userId, content: r.content, reaction: r.reaction })),
  }));

  return { items, nextCursor };
}

export async function submitReflection(
  sessionId: string,
  reaction?: string,
  content?: string
) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  const dailySession = await requireSessionMembership(session.user.id, sessionId);
  if (dailySession.state !== "revealed")
    throw new Error("Reflections are available after reveal.");
  const existing = await prisma.reflection.findUnique({
    where: { sessionId_userId: { sessionId, userId: session.user.id } },
  });
  await (existing
    ? prisma.reflection.update({
        where: { sessionId_userId: { sessionId, userId: session.user.id } },
        data: { reaction: reaction ?? existing.reaction, content: content ?? existing.content },
      })
    : prisma.reflection.create({
        data: {
          sessionId,
          userId: session.user.id,
          reaction: reaction ?? null,
          content: content ?? null,
        },
      }));
  revalidatePath(`/app/session/${sessionId}`);
}

/** Ensure response exists, session is revealed, and current user is the partner (not the author). Returns sessionId for revalidate. */
async function requireResponseForValidation(responseId: string, currentUserId: string) {
  const response = await prisma.response.findUnique({
    where: { id: responseId },
    include: { session: { select: { id: true, relationshipId: true, state: true } } },
  });
  if (!response) throw new Error("Response not found");
  if (response.session.state !== "revealed") throw new Error("Validation is available after reveal.");
  if (response.userId === currentUserId) throw new Error("You can only validate your partner's response.");
  await requireActiveMember(currentUserId, response.session.relationshipId);
  return { sessionId: response.session.id };
}

export async function setReactions(responseId: string, emojiList: string[]) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  if (emojiList.length > 2) throw new Error("Maximum 2 reactions allowed.");
  const allowed = new Set<string>(VALIDATION_ALLOWED_EMOJIS);
  for (const emoji of emojiList) {
    if (!allowed.has(emoji)) throw new Error("Invalid reaction.");
  }
  const reactionsValue = emojiList.length > 0 ? emojiList.join("") : null;

  const { sessionId } = await requireResponseForValidation(responseId, session.user.id);

  await prisma.responseValidation.upsert({
    where: { responseId_userId: { responseId, userId: session.user.id } },
    create: { responseId, userId: session.user.id, reactions: reactionsValue, acknowledgment: null },
    update: { reactions: reactionsValue },
  });

  revalidatePath("/app/history");
  revalidatePath(`/app/session/${sessionId}`);
}

export async function setAcknowledgment(responseId: string, text: string) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  if (text.length > VALIDATION_ACK_MAX_LENGTH) throw new Error("Acknowledgment must be 100 characters or less.");
  const acknowledgmentValue = text.trim().length > 0 ? text.trim() : null;

  const { sessionId } = await requireResponseForValidation(responseId, session.user.id);

  await prisma.responseValidation.upsert({
    where: { responseId_userId: { responseId, userId: session.user.id } },
    create: { responseId, userId: session.user.id, reactions: null, acknowledgment: acknowledgmentValue },
    update: { acknowledgment: acknowledgmentValue },
  });

  revalidatePath("/app/history");
  revalidatePath(`/app/session/${sessionId}`);
}
