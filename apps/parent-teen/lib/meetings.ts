"use server";

import { revalidatePath } from "next/cache";
import { getISOWeek, getISOWeekYear } from "date-fns";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/relationship-members";

/** ISO week key for a date, e.g. "2026-W07". */
function getWeekKey(date: Date): string {
  const y = getISOWeekYear(date);
  const w = getISOWeek(date);
  return `${y}-W${String(w).padStart(2, "0")}`;
}

/** Verify user is active member of the meeting's relationship. Returns minimal meeting. */
async function requireMeetingMembership(userId: string, meetingId: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { id: true, relationshipId: true, weekKey: true },
  });
  if (!meeting) throw new Error("Meeting not found");
  await requireActiveMember(userId, meeting.relationshipId);
  return meeting;
}

export type MeetingFields = {
  wins?: string | null;
  stressors?: string | null;
  request?: string | null;
  plan?: string | null;
  appreciation?: string | null;
};

export type GetCurrentMeetingResult = {
  meetingId: string;
  weekKey: string;
  hasUserSubmitted: boolean;
  hasPartnerSubmitted: boolean;
  canViewPartner: boolean;
};

export async function getCurrentMeeting(
  relationshipId: string
): Promise<GetCurrentMeetingResult | null> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  await requireActiveMember(session.user.id, relationshipId);
  const memberIds = await getActiveMemberIds(relationshipId);
  if (memberIds.length === 0) return null;

  const weekKey = getWeekKey(new Date());
  let meeting = await prisma.meeting.findUnique({
    where: { relationshipId_weekKey: { relationshipId, weekKey } },
    include: { entries: { select: { userId: true } } },
  });

  if (!meeting) {
    meeting = await prisma.meeting.create({
      data: { relationshipId, weekKey },
      include: { entries: { select: { userId: true } } },
    });
  }

  const hasUserSubmitted = meeting.entries.some((e) => e.userId === session.user!.id);
  const partnerIds = memberIds.filter((id) => id !== session.user!.id);
  const hasPartnerSubmitted =
    partnerIds.length > 0 &&
    partnerIds.every((id) => meeting!.entries.some((e) => e.userId === id));
  const exactlyTwo = memberIds.length === 2;
  const canViewPartner = exactlyTwo && hasUserSubmitted && hasPartnerSubmitted;

  return {
    meetingId: meeting.id,
    weekKey: meeting.weekKey,
    hasUserSubmitted,
    hasPartnerSubmitted,
    canViewPartner,
  };
}

export async function submitMeeting(meetingId: string, fields: MeetingFields) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  await requireMeetingMembership(session.user.id, meetingId);

  const createData = {
    meetingId,
    userId: session.user.id,
    wins: fields.wins ?? null,
    stressors: fields.stressors ?? null,
    request: fields.request ?? null,
    plan: fields.plan ?? null,
    appreciation: fields.appreciation ?? null,
  };
  const updateData: Partial<Record<keyof MeetingFields, string | null>> = {};
  if (fields.wins !== undefined) updateData.wins = fields.wins;
  if (fields.stressors !== undefined) updateData.stressors = fields.stressors;
  if (fields.request !== undefined) updateData.request = fields.request;
  if (fields.plan !== undefined) updateData.plan = fields.plan;
  if (fields.appreciation !== undefined) updateData.appreciation = fields.appreciation;

  await prisma.meetingEntry.upsert({
    where: {
      meetingId_userId: { meetingId, userId: session.user.id },
    },
    create: createData,
    update: Object.keys(updateData).length > 0 ? updateData : { updatedAt: new Date() },
  });

  revalidatePath("/app");
  revalidatePath("/app/meeting");
  revalidatePath(`/app/meeting/${meetingId}`);
}

export type MeetingEntryData = {
  wins: string | null;
  stressors: string | null;
  request: string | null;
  plan: string | null;
  appreciation: string | null;
};

export type GetMeetingResult = {
  meetingId: string;
  relationshipId: string;
  weekKey: string;
  ownEntry: MeetingEntryData | null;
  partnerEntry: MeetingEntryData | null; // only set when canViewPartner
  canViewPartner: boolean;
  hasUserSubmitted: boolean;
  hasPartnerSubmitted: boolean;
};

export async function getMeeting(meetingId: string): Promise<GetMeetingResult | null> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  await requireMeetingMembership(session.user.id, meetingId);

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { entries: true },
  });
  if (!meeting) return null;

  const memberIds = await getActiveMemberIds(meeting.relationshipId);
  const userEntry = meeting.entries.find((e) => e.userId === session.user!.id);
  const partnerIds = memberIds.filter((id) => id !== session.user!.id);
  const hasPartnerSubmitted =
    partnerIds.length > 0 &&
    partnerIds.every((id) => meeting.entries.some((e) => e.userId === id));
  const exactlyTwo = memberIds.length === 2;
  const toEntryData = (e: { wins: string | null; stressors: string | null; request: string | null; plan: string | null; appreciation: string | null }): MeetingEntryData => ({
    wins: e.wins ?? null,
    stressors: e.stressors ?? null,
    request: e.request ?? null,
    plan: e.plan ?? null,
    appreciation: e.appreciation ?? null,
  });

  const partnerEntryRow = meeting.entries.find((e) => e.userId !== session.user!.id);
  const partnerEntry = partnerEntryRow ? toEntryData(partnerEntryRow) : null;
  const canViewPartner = exactlyTwo && !!partnerEntryRow;

  return {
    meetingId: meeting.id,
    relationshipId: meeting.relationshipId,
    weekKey: meeting.weekKey,
    ownEntry: userEntry ? toEntryData(userEntry) : null,
    partnerEntry,
    canViewPartner,
    hasUserSubmitted: !!userEntry,
    hasPartnerSubmitted: partnerIds.length === 0 ? false : hasPartnerSubmitted,
  };
}

export type MeetingHistoryItem = {
  meetingId: string;
  weekKey: string;
  hasUserSubmitted: boolean;
  hasPartnerSubmitted: boolean;
  canViewPartner: boolean;
};

export async function getMeetingHistory(
  relationshipId: string
): Promise<MeetingHistoryItem[]> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) throw new Error("Not signed in");

  await requireActiveMember(session.user.id, relationshipId);

  const meetings = await prisma.meeting.findMany({
    where: { relationshipId },
    orderBy: { weekKey: "desc" },
    include: { entries: { select: { userId: true } } },
  });

  const memberIds = await getActiveMemberIds(relationshipId);
  const exactlyTwo = memberIds.length === 2;

  return meetings.map((m) => {
    const hasUserSubmitted = m.entries.some((e) => e.userId === session.user!.id);
    const partnerIds = memberIds.filter((id) => id !== session.user!.id);
    const hasPartnerSubmitted =
      partnerIds.length > 0 &&
      partnerIds.every((id) => m.entries.some((e) => e.userId === id));
    const canViewPartner = exactlyTwo && hasUserSubmitted && hasPartnerSubmitted;
    return {
      meetingId: m.id,
      weekKey: m.weekKey,
      hasUserSubmitted,
      hasPartnerSubmitted,
      canViewPartner,
    };
  });
}
