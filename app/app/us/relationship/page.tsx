import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { RelationshipActions } from "../../relationship-actions";

export const dynamic = "force-dynamic";

export default async function ManageRelationshipPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const primary = relationships[0] ?? null;
  if (!primary) redirect("/app/us");

  return (
    <main className="flex h-full flex-col gap-6">
      <header className="space-y-1">
        <Link
          href="/app/us"
          className="text-sm font-medium text-pink-600 underline hover:text-pink-500"
        >
          ← Back to Profile
        </Link>
        <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
          Manage relationship
        </h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Invite your partner, see status, or leave this relationship.
        </p>
      </header>

      <section className="rounded-2xl border border-pink-100 bg-white px-4 py-4 shadow-md shadow-pink-100/80 sm:px-5 sm:py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
              Relationship
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900 sm:text-2xl">
              {primary.name ?? "Your relationship"}
            </p>
            <p className="text-sm text-slate-600 sm:text-base">
              Invite your partner, see your connection status, and manage this relationship.
            </p>
          </div>
          <div className="hidden shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
            Connected
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/invite"
            className="inline-flex items-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-pink-300/60 hover:bg-pink-400"
          >
            Invite partner
          </Link>
        </div>

        <div className="mt-4 border-t border-pink-100 pt-3">
          <RelationshipActions relationshipId={primary.id} />
        </div>
      </section>
    </main>
  );
}
