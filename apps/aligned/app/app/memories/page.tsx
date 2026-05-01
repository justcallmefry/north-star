import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { listMemoriesForRelationship } from "@/lib/memories";
import { getPartnerUserId } from "@/lib/push";
import { prisma } from "@/lib/prisma";
import { AppreciationComposer } from "./appreciation-composer";
import { MemoriesListWithFilters } from "./memories-list-with-filters";

export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const primary = relationships[0] ?? null;
  if (!primary) redirect("/app/pair");

  const memories = await listMemoriesForRelationship(primary.id);
  const partnerId = await getPartnerUserId(primary.id, session.user.id);
  const partner = partnerId
    ? await prisma.user.findUnique({
        where: { id: partnerId },
        select: { name: true },
      })
    : null;

  return (
    <main className="ns-stack">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-peach-300/30 px-3 py-1 ring-1 ring-peach-300/40">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-peach-500">
            <Bookmark className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-peach-600">
            Memories
          </span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
          The moments you kept
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Things you both said, the days that mattered. Tap save on any reveal to add it here.
        </p>
      </header>

      <AppreciationComposer
        relationshipId={primary.id}
        partnerName={partner?.name ?? null}
      />

      <MemoriesListWithFilters memories={memories} relationshipId={primary.id} />
    </main>
  );
}
