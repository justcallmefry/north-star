"use server";

import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDedication } from "@/lib/dedication";
import { getStreak, updateStreakOnReveal, type StreakInfo } from "@/lib/streak";
import { getActiveMemberIds, requireActiveMember, todayUTC } from "@/lib/relationship-members";
import { pickPrompt } from "@/lib/prompt-scheduler";
import { getThrowbackForToday } from "@/lib/throwback";
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

function toDateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Stable cyrb53-lite hash for deterministic prompt picking. */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * True when `today` falls within `windowDaysBefore` days before — or on — the
 * couple's anniversary in the current calendar year. Feb 29 anniversaries in
 * non-leap years roll back to Feb 28 (window fires one day early that year).
 */
function isWithinAnniversaryWindow(
  anniversaryDate: Date | null | undefined,
  today: Date,
  windowDaysBefore = 7
): boolean {
  if (!anniversaryDate) return false;
  const annivMonth = anniversaryDate.getUTCMonth();
  const annivDay = anniversaryDate.getUTCDate();
  let thisYear = new Date(Date.UTC(today.getUTCFullYear(), annivMonth, annivDay));
  // Feb 29 in non-leap year → JS rolls to Mar 1; clamp back to Feb 28.
  if (thisYear.getUTCMonth() !== annivMonth) {
    thisYear = new Date(Date.UTC(today.getUTCFullYear(), annivMonth, annivDay - 1));
  }
  const diffDays = Math.floor((thisYear.getTime() - today.getTime()) / 86400000);
  return diffDays >= 0 && diffDays <= windowDaysBefore;
}

/**
 * Deterministic, tone-balanced prompt selection. See lib/prompt-scheduler.ts
 * for the policy. Same prompt for both partners on the same day; different
 * couples get different sequences.
 *
 * Anniversary preference: when today is within the 7-day window before (or on)
 * the couple's anniversary, prefer prompts tagged "anniversary" that haven't
 * been used in the last 90 sessions. Falls through to the normal scheduler if
 * no anniversary prompts are eligible.
 */
async function pickPromptForSession(relationshipId: string): Promise<string | null> {
  // Anniversary preference: cheap pre-check before the heavy scheduler query.
  const today = todayUTC();
  const relationship = await prisma.relationship.findUnique({
    where: { id: relationshipId },
    select: { anniversaryDate: true },
  });
  if (isWithinAnniversaryWindow(relationship?.anniversaryDate ?? null, today)) {
    const annivPrompts = await prisma.prompt.findMany({
      where: {
        active: true,
        type: "daily",
        tags: { has: "anniversary" },
      },
      select: { id: true },
    });
    if (annivPrompts.length > 0) {
      // Exclude prompts used in the last 90 sessions (defense against
      // re-picking the same anniversary prompt year-over-year too quickly).
      const recentIds = new Set(
        (
          await prisma.dailySession.findMany({
            where: { relationshipId },
            orderBy: { sessionDate: "desc" },
            take: 90,
            select: { promptId: true },
          })
        )
          .map((r) => r.promptId)
          .filter((id): id is string => !!id)
      );
      const fresh = annivPrompts.filter((p) => !recentIds.has(p.id));
      const pool = fresh.length > 0 ? fresh : annivPrompts;
      const todayKey = toDateKey(today);
      const idx = hashStr(`${relationshipId}::anniversary::${todayKey}`) % pool.length;
      return pool[idx]!.id;
    }
    // No anniversary-tagged prompts seeded — fall through to default selection.
  }

  const [recentRaw, totalCount] = await Promise.all([
    prisma.dailySession.findMany({
      where: { relationshipId },
      orderBy: { sessionDate: "desc" },
      take: 21,
      select: {
        promptId: true,
        sessionDate: true,
        prompt: { select: { category: true, tone: true, depthLevel: true } },
      },
    }),
    prisma.dailySession.count({ where: { relationshipId } }),
  ]);
  const isIntroPhase = totalCount < 7;

  const eligible = await prisma.prompt.findMany({
    where: {
      active: true,
      type: "daily",
      isMilestone: false,
      ...(isIntroPhase && {
        category: { in: ["gratitude", "fun", "reflection", "growth"] },
        tone: { in: ["light", "playful"] },
        depthLevel: { lte: 2 },
      }),
      // later: isPremium: false if not subscribed
    },
    select: {
      id: true,
      category: true,
      tone: true,
      depthLevel: true,
      funScore: true,
      isMilestone: true,
      weekendOnly: true,
    },
  });

  const recent = recentRaw.map((r) => ({
    sessionDate: toDateKey(r.sessionDate),
    promptId: r.promptId,
    category: r.prompt?.category ?? null,
    tone: r.prompt?.tone ?? null,
    depthLevel: r.prompt?.depthLevel ?? null,
  }));

  return pickPrompt({
    relationshipId,
    todayKey: toDateKey(todayUTC()),
    eligible,
    recent,
  });
}

export type GetTodayResult = {
  sessionId: string;
  relationshipId: string;
  promptText: string;
  momentText?: string | null;
  state: "open" | "revealed" | "expired";
  hasUserResponded: boolean;
  hasPartnerResponded: boolean;
  canReveal: boolean;
  partnerName?: string | null;
  /** Consecutive days the couple has completed the question (revealed). */
  streak?: StreakInfo | null;
  /** This user's total daily check-ins in this relationship (never resets). */
  dedication?: { totalCheckIns: number } | null;
  /** Prompt category for the meta line + featured-slot logic. */
  category?: string | null;
  /** Prompt tone for the meta line. */
  tone?: string | null;
  /** Prompt depth (1..5) — drives estimated time. */
  depthLevel?: number | null;
  /** "sun".."sat" — drives day theme on the client. */
  dayThemeKey?: "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
};

export type ThrowbackTodayResult = {
  variant: "throwback";
  relationshipId: string;
  /** Memory we're surfacing — pass to "Answer it again" action. */
  memoryId: string;
  /** Original promptId — null if the source session is gone (then disable action). */
  promptId: string | null;
  /** "7 months ago", etc. */
  monthsAgo: number;
  promptText: string;
  responses: Array<{ userId: string; name: string | null; content: string | null }>;
  partnerName?: string | null;
};

export type TodayResponse =
  | { variant: "standard"; today: GetTodayResult | null }
  | { variant: "throwback"; throwback: ThrowbackTodayResult };

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
      // Past midnight (user's local) — show today's question, get or create
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
    partnerIds.length === 0
      ? false
      : partnerIds.every((id) => dailySession!.responses.some((r) => r.userId === id));
  const canReveal =
    dailySession.state === "open" &&
    hasUserResponded &&
    hasPartnerResponded &&
    memberIds.length >= 2;

  const [streak, dedication, partnerUser] = await Promise.all([
    getStreak(relationshipId),
    getDedication(relationshipId, session.user.id),
    partnerIds[0]
      ? prisma.user.findUnique({ where: { id: partnerIds[0] }, select: { name: true } })
      : Promise.resolve(null),
  ]);

  const dayKeys = ["sun","mon","tue","wed","thu","fri","sat"] as const;
  const sessionDayKey = dayKeys[dailySession.sessionDate.getUTCDay()];

  return {
    sessionId: dailySession.id,
    relationshipId,
    promptText,
    momentText,
    state: dailySession.state as "open" | "revealed" | "expired",
    hasUserResponded,
    hasPartnerResponded,
    canReveal,
    partnerName: partnerUser?.name ?? null,
    streak: streak ?? undefined,
    dedication: dedication.totalCheckIns > 0 ? dedication : undefined,
    category: dailySession.prompt?.category ?? null,
    tone: dailySession.prompt?.tone ?? null,
    depthLevel: dailySession.prompt?.depthLevel ?? null,
    dayThemeKey: sessionDayKey,
  };
}

/**
 * Wraps getToday() with the Saturday Throwback variant.
 * Saturday + eligible memory + deterministic share → throwback variant.
 * Otherwise → standard.
 */
export async function getTodayWithVariant(
  relationshipId: string,
  localDateStr?: string
): Promise<TodayResponse> {
  const dateStr = localDateStr ?? new Date().toISOString().slice(0, 10);
  const throwback = await getThrowbackForToday(relationshipId, dateStr);
  if (throwback) {
    const session = await getServerAuthSession();
    const userId = session?.user?.id ?? null;
    const memberIds = userId ? await getActiveMemberIds(relationshipId) : [];
    const partnerId = userId ? memberIds.find((id) => id !== userId) ?? null : null;
    const partner = partnerId
      ? await prisma.user.findUnique({ where: { id: partnerId }, select: { name: true } })
      : null;
    return {
      variant: "throwback",
      throwback: {
        variant: "throwback",
        relationshipId,
        memoryId: throwback.memoryId,
        promptId: throwback.promptId,
        monthsAgo: throwback.monthsAgo,
        promptText: throwback.promptText,
        responses: throwback.responses,
        partnerName: partner?.name ?? null,
      },
    };
  }
  const today = await getToday(relationshipId, localDateStr);
  return { variant: "standard", today };
}

/**
 * Create or fetch today's DailySession, optionally forcing a specific prompt.
 * Used by the "Answer it again" action on the Saturday throwback card.
 * If a session for today already exists, returns its id without changes.
 */
export async function createOrGetTodaySession(
  relationshipId: string,
  localDateStr: string,
  forcePromptId?: string
): Promise<{ sessionId: string }> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  await requireActiveMember(session.user.id, relationshipId);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDateStr)) {
    throw new Error("Invalid date");
  }
  const today = new Date(localDateStr + "T00:00:00.000Z");

  const existing = await prisma.dailySession.findUnique({
    where: { relationshipId_sessionDate: { relationshipId, sessionDate: today } },
    select: { id: true },
  });
  if (existing) return { sessionId: existing.id };

  const promptId = forcePromptId ?? (await pickPromptForSession(relationshipId));
  const created = await prisma.dailySession.create({
    data: { relationshipId, sessionDate: today, promptId, state: "open" },
    select: { id: true },
  });
  revalidatePath("/app");
  return { sessionId: created.id };
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
  if (memberIds.length < 2)
    throw new Error("This space needs at least 2 active people.");
  const withResponses = await prisma.dailySession.findUnique({
    where: { id: sessionId },
    include: { responses: { select: { userId: true } } },
  });
  const allResponded =
    memberIds.length >= 2 &&
    withResponses &&
    memberIds.every((id) => withResponses.responses.some((r) => r.userId === id));
  if (!allResponded) throw new Error("Everyone needs to answer before revealing.");

  await prisma.dailySession.update({
    where: { id: sessionId },
    data: { state: "revealed" },
  });

  await updateStreakOnReveal(base.relationshipId, base.sessionDate);

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
  /** All revealed responses with names/images when available (2 or 3 people). */
  allResponses?: {
    id: string;
    userId: string;
    name: string | null;
    image: string | null;
    content: string | null;
  }[];
  /** Number of active members in the relationship (for "X of N responses"). */
  memberCount?: number;
  /** Number of members who have submitted a response this session. */
  respondedCount?: number;
  /** Consecutive days the couple has completed the question (revealed). */
  streak?: StreakInfo | null;
  /** This user's total daily check-ins in this relationship (never resets). */
  dedication?: { totalCheckIns: number } | null;
  /** True when this is the first revealed daily session for this relationship. */
  isFirstCompletedSession?: boolean;
  /** When true, the UI should offer the pre-reveal "guess what they wrote" flow. */
  partnerGuessEnabled?: boolean;
  /** When true, after reveal the UI should offer a date-activation nudge. */
  isDateActivation?: boolean;
  /** Prompt category — used client-side to pick a contextual follow-up conversation prompt. */
  promptCategory?: string | null;
  /** Up to 3 content words in the partner's revealed answer that have never appeared in their past responses for this couple. Empty/undefined when none. */
  noveltyTags?: string[];
  /** True when this session was created by re-answering a saved Memory. UI shows the Then/Now treatment when set. */
  isThrowback?: boolean;
  /** When isThrowback, the original Memory's responses for the Then panel. */
  throwbackThen?: Array<{ userId: string; name: string | null; content: string | null }> | null;
  /** Months ago the original was answered. */
  throwbackMonthsAgo?: number;
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
    partnerIds.length === 0
      ? false
      : partnerIds.every((id) => dailySession.responses.some((r) => r.userId === id));
  const canReveal =
    dailySession.state === "open" &&
    !!userResponse &&
    hasPartnerResponded &&
    memberIds.length >= 2;

  const memberCount = memberIds.length;
  const respondedCount = dailySession.responses.length;
  const [streak, dedication] = await Promise.all([
    getStreak(dailySession.relationshipId),
    getDedication(dailySession.relationshipId, session.user.id),
  ]);
  const revealedBeforeCount =
    dailySession.state === "revealed"
      ? await prisma.dailySession.count({
          where: {
            relationshipId: dailySession.relationshipId,
            state: "revealed",
            sessionDate: { lt: dailySession.sessionDate },
          },
        })
      : 0;
  const isFirstCompletedSession = dailySession.state === "revealed" && revealedBeforeCount === 0;
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
    memberCount,
    respondedCount,
    streak: streak ?? undefined,
    dedication: dedication.totalCheckIns > 0 ? dedication : undefined,
    isFirstCompletedSession,
    partnerGuessEnabled: dailySession.prompt?.partnerGuessEnabled ?? false,
    isDateActivation: dailySession.prompt?.isDateActivation ?? false,
    promptCategory: dailySession.prompt?.category ?? null,
  };

  if (dailySession.state === "revealed") {
    const partner = dailySession.responses.find((r) => r.userId !== session.user!.id);
    result.partnerResponse = partner?.content ?? null;
    result.reflections = dailySession.reflections.map((r) => ({
      userId: r.userId,
      content: r.content,
      reaction: r.reaction,
    }));
    const responseUserIds = Array.from(
      new Set(dailySession.responses.map((r) => r.userId))
    );
    const users = await prisma.user.findMany({
      where: { id: { in: responseUserIds } },
      select: { id: true, name: true, image: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    const currentUser = userMap.get(session.user!.id);
    const firstOther = users.find((u) => u.id !== session.user!.id) ?? null;
    result.currentUserName = currentUser?.name ?? null;
    result.currentUserImage = currentUser?.image ?? null;
    result.partnerName = firstOther?.name ?? null;
    result.partnerImage = firstOther?.image ?? null;
    result.allResponses = dailySession.responses.map((r) => {
      const u = userMap.get(r.userId);
      return {
        id: r.id,
        userId: r.userId,
        name: u?.name ?? null,
        image: u?.image ?? null,
        content: r.content,
      };
    });
  }

  // Novelty tags — words the partner has never used in any past response for
  // this couple. Skipped when the user is alone (no partner answer).
  if (dailySession.state === "revealed" && result.partnerResponse) {
    const partnerUserId = dailySession.responses.find(
      (r) => r.userId !== session.user!.id
    )?.userId;
    if (partnerUserId) {
      const pastPartner = await prisma.response.findMany({
        where: {
          userId: partnerUserId,
          session: { relationshipId: dailySession.relationshipId },
          NOT: { sessionId: dailySession.id },
        },
        select: { content: true },
      });
      const { findNovelTags } = await import("@/lib/novelty");
      result.noveltyTags = findNovelTags(
        result.partnerResponse,
        pastPartner.map((r) => r.content),
        result.userResponse
      );
    }
  }

  // Then/Now metadata — when a Memory exists for this prompt + relationship
  // and predates this session, the UI shows a Then/Now panel. We can't filter
  // on promptId in the Memory query directly (it's not a column), so we fetch
  // recent Memories and resolve their source DailySession.
  if (dailySession.state === "revealed" && dailySession.promptId) {
    const earlierMemories = await prisma.memory.findMany({
      where: {
        relationshipId: dailySession.relationshipId,
        sourceType: "session_reveal",
        savedAt: { lt: dailySession.sessionDate },
      },
      orderBy: { savedAt: "desc" },
      take: 20,
      select: { sourceId: true, savedAt: true, snapshot: true },
    });
    for (const mem of earlierMemories) {
      if (!mem.sourceId) continue;
      const sourceSession = await prisma.dailySession.findUnique({
        where: { id: mem.sourceId },
        select: { promptId: true, sessionDate: true },
      });
      if (sourceSession?.promptId === dailySession.promptId) {
        const snap = mem.snapshot as unknown as {
          responses?: Array<{ userId: string; name: string | null; content: string | null }>;
        } | null;
        const ms =
          dailySession.sessionDate.getTime() - sourceSession.sessionDate.getTime();
        const monthsAgo = Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24 * 30)));
        result.isThrowback = true;
        result.throwbackThen = snap?.responses ?? null;
        result.throwbackMonthsAgo = monthsAgo;
        break;
      }
    }
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
    /** True when this slot is for a member who did not answer that day */
    noResponse?: boolean;
  }[];
  reflections: { userId: string; content: string | null; reaction: string | null }[];
};

const HISTORY_PAGE_SIZE = 10;

/** Get paginated history: only sessions where at least one person answered. Two slots per session (one per member); missing response shown as "No response that day". */
export async function getHistory(
  relationshipId: string,
  page = 1,
  pageSize = HISTORY_PAGE_SIZE
): Promise<{
  items: HistoryItem[];
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  await requireActiveMember(session.user.id, relationshipId);

  const memberIds = await getActiveMemberIds(relationshipId);
  if (memberIds.length === 0) {
    return { items: [], page: 1, totalPages: 0, hasPrev: false, hasNext: false };
  }

  const where = {
    relationshipId,
    responses: { some: {} },
  } as const;

  const [total, sessionsRaw] = await Promise.all([
    prisma.dailySession.count({ where }),
    prisma.dailySession.findMany({
      where,
      orderBy: { sessionDate: "desc" as const },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    }),
  ]);

  type Row = { id: string; userId: string; content: string | null; validations?: { userId: string; reactions: string | null; acknowledgment: string | null }[] };
  let list: { id: string; sessionDate: Date; prompt: { text: string | null } | null; responses: Row[]; reflections: { userId: string; content: string | null; reaction: string | null }[] }[];
  try {
    list = sessionsRaw as typeof list;
  } catch {
    const fallback = await prisma.dailySession.findMany({
      where,
      orderBy: { sessionDate: "desc" as const },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        prompt: true,
        responses: { select: { id: true, userId: true, content: true } },
        reflections: { select: { userId: true, content: true, reaction: true } },
      },
    });
    list = fallback.map((s) => ({ ...s, responses: s.responses.map((r) => ({ ...r, validations: [] as Row["validations"] })) })) as typeof list;
  }

  const allUserIds = [...new Set(memberIds)];
  for (const s of list) {
    for (const r of s.responses) {
      if (!allUserIds.includes(r.userId)) allUserIds.push(r.userId);
    }
  }
  const users =
    allUserIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: allUserIds } }, select: { id: true, name: true, image: true } })
      : [];
  const userMap = new Map(users.map((u) => [u.id, { name: u.name, image: u.image }]));

  const items: HistoryItem[] = list.map((s) => {
    const responseByUserId = new Map(s.responses.map((r) => [r.userId, r]));
    const responses = memberIds.map((userId) => {
      const r = responseByUserId.get(userId);
      const u = userMap.get(userId);
      if (r) {
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
      }
      return {
        id: "",
        userId,
        content: null,
        userName: u?.name ?? null,
        userImage: u?.image ?? null,
        validation: null,
        noResponse: true,
      };
    });
    return {
      sessionId: s.id,
      sessionDate: s.sessionDate,
      promptText: s.prompt?.text ?? "",
      responses,
      reflections: s.reflections.map((r) => ({ userId: r.userId, content: r.content, reaction: r.reaction })),
    };
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  return {
    items,
    page: safePage,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  };
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

export type WeekActivity = {
  /** YYYY-MM-DD for each of the last 7 days (oldest first) */
  days: { date: string; completed: boolean }[];
};

/** Returns revealed/completed status for each of the last 7 calendar days (user's local). */
export async function getWeekActivity(
  relationshipId: string,
  localDateStr: string
): Promise<WeekActivity> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");
  await requireActiveMember(session.user.id, relationshipId);

  const days: { date: string; completed: boolean }[] = [];
  const anchor = new Date(localDateStr + "T00:00:00.000Z");
  for (let i = 6; i >= 0; i--) {
    const d = new Date(anchor);
    d.setUTCDate(anchor.getUTCDate() - i);
    days.push({ date: d.toISOString().slice(0, 10), completed: false });
  }

  const from = new Date(days[0]!.date + "T00:00:00.000Z");
  const to = new Date(days[days.length - 1]!.date + "T23:59:59.999Z");

  const sessions = await prisma.dailySession.findMany({
    where: {
      relationshipId,
      state: "revealed",
      sessionDate: { gte: from, lte: to },
    },
    select: { sessionDate: true },
  });

  const completedDates = new Set(sessions.map((s) => s.sessionDate.toISOString().slice(0, 10)));
  return {
    days: days.map((d) => ({ ...d, completed: completedDates.has(d.date) })),
  };
}
