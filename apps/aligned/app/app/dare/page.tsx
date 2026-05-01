import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDareForWeek } from "@/lib/dare";
import { DareClient } from "./dare-client";

export const dynamic = "force-dynamic";

export default async function DarePage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/");

  // Look up the user's active relationship.
  const member = await prisma.relationshipMember.findFirst({
    where: { userId: session.user.id, leftAt: null },
    select: { relationshipId: true },
  });

  const dare = member ? await getDareForWeek(member.relationshipId) : null;

  return (
    <div className="space-y-4">
      <DareClient initialDare={dare} />
    </div>
  );
}
