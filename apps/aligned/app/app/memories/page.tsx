import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { listMemoriesForRelationship, type MemoryListItem } from "@/lib/memories";
import { getPartnerUserId } from "@/lib/push";
import { prisma } from "@/lib/prisma";
import { AppreciationComposer } from "./appreciation-composer";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function MemoryCard({ memory }: { memory: MemoryListItem }) {
  const { snapshot } = memory;
  if (snapshot.kind === "session_reveal") {
    const myEntry = snapshot.responses[0];
    const partnerEntry = snapshot.responses[1];
    return (
      <article className="ns-card space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          {formatDate(memory.savedAt)}
        </p>
        {snapshot.promptText && (
          <p className="font-display text-lg font-semibold leading-snug text-slate-900 sm:text-xl">
            {snapshot.promptText}
          </p>
        )}
        <div className="space-y-2">
          {myEntry && (
            <p className="rounded-xl border border-dusk-100 bg-dusk-50/50 px-3 py-2 text-base text-slate-800 sm:text-lg">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-dusk-700">
                {myEntry.name ?? "You"}
              </span>
              <br />
              {myEntry.content ?? "—"}
            </p>
          )}
          {partnerEntry && (
            <p className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-base text-slate-800 sm:text-lg">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                {partnerEntry.name ?? "Them"}
              </span>
              <br />
              {partnerEntry.content ?? "—"}
            </p>
          )}
        </div>
      </article>
    );
  }
  if (snapshot.kind === "appreciation") {
    return (
      <article className="rounded-2xl bg-gradient-to-br from-peach-300/30 to-peach-300/10 border border-peach-300/30 p-5 space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-peach-600">
          Appreciation · {formatDate(memory.savedAt)}
        </p>
        <p className="text-base leading-relaxed text-slate-800 sm:text-lg">
          {snapshot.message}
        </p>
        {snapshot.fromName && (
          <p className="text-sm text-slate-600">— {snapshot.fromName}</p>
        )}
      </article>
    );
  }
  return null;
}

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

      {memories.length === 0 ? (
        <section className="rounded-2xl bg-gradient-to-br from-peach-50/60 via-white to-brand-50/30 border border-peach-200/40 p-8 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-peach-300/30 text-peach-600">
            <Bookmark className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <p className="mt-6 font-display text-xl font-semibold text-slate-900 sm:text-2xl">
            Your first memory is waiting to be made.
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-700 sm:text-lg">
            When a question lands just right—when their answer surprises you, or says exactly what you were feeling—save it. It&apos;ll be here waiting.
          </p>
          <Link
            href="/app"
            className="ns-btn-primary mt-6 inline-flex w-full items-center justify-center gap-2 py-3 sm:w-auto sm:px-6"
          >
            Answer today&apos;s question
          </Link>
        </section>
      ) : (
        <div className="space-y-3">
          {memories.map((m) => (
            <MemoryCard key={m.id} memory={m} />
          ))}
        </div>
      )}
    </main>
  );
}
