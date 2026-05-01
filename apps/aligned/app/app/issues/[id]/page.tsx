import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/relationship-members";
import type { CoverGradient, IssueSection } from "@/lib/issues/types";
import { IssueReader } from "./issue-reader";

export const dynamic = "force-dynamic";

export default async function IssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect("/login");

  const issue = await prisma.issue.findUnique({
    where: { id },
    select: {
      id: true,
      relationshipId: true,
      cadence: true,
      issueNumber: true,
      volumeNumber: true,
      windowStart: true,
      windowEnd: true,
      publishedAt: true,
      headline: true,
      coverPhotoUrl: true,
      coverGradient: true,
      sections: true,
      savedAt: true,
    },
  });
  if (!issue) redirect("/app/issues");

  await requireActiveMember(session.user.id, issue.relationshipId);

  const members = await prisma.relationshipMember.findMany({
    where: { relationshipId: issue.relationshipId, leftAt: null },
    orderBy: { createdAt: "asc" },
    select: { user: { select: { name: true } } },
    take: 2,
  });
  const aName = members[0]?.user?.name ?? "—";
  const bName = members[1]?.user?.name ?? "—";

  return (
    <IssueReader
      issue={{
        id: issue.id,
        issueNumber: issue.issueNumber,
        volumeNumber: issue.volumeNumber,
        windowStart: issue.windowStart,
        windowEnd: issue.windowEnd,
        publishedAt: issue.publishedAt,
        headline: issue.headline,
        coverPhotoUrl: issue.coverPhotoUrl,
        coverGradient: issue.coverGradient as CoverGradient | null,
        sections: issue.sections as unknown as IssueSection[],
        initialSaved: !!issue.savedAt,
      }}
      partnerNames={{ a: aName, b: bName }}
    />
  );
}
