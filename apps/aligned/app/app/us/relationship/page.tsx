import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { RelationshipActions } from "../../relationship-actions";
import { SharedCalendarTimezoneForm } from "./shared-calendar-timezone-form";

export const dynamic = "force-dynamic";

export default async function ManageRelationshipPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const primary = relationships[0] ?? null;
  if (!primary) redirect("/app/us");

  return (
    <main className="flex h-full flex-col ns-stack">
      <header className="space-y-1">
        <Link
          href="/app/us"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-200 rounded"
        >
          <span aria-hidden>←</span> You
        </Link>
        <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
          Relationship &amp; invites
        </h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Invite your partner, refresh a link, or leave this space if you need to.
        </p>
      </header>

      <section className="ns-card">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
              Relationship
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900 sm:text-2xl">
              {primary.name ?? "Your relationship"}
            </p>
            <p className="text-sm text-slate-600 sm:text-base">
              Invite your partner, see status, manage or leave.
            </p>
          </div>
          <div className="hidden shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
            Connected
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/invite"
            className="ns-btn-primary"
          >
            Invite partner
          </Link>
        </div>

        <div className="mt-4 border-t border-brand-100 pt-3">
          <p className="text-sm font-semibold text-slate-900">Shared calendar day</p>
          <SharedCalendarTimezoneForm
            relationshipId={primary.id}
            initialTimeZone={primary.sharedCalendarTimezone ?? null}
          />
        </div>

        <div className="mt-6 border-t border-brand-100 pt-3">
          <RelationshipActions relationshipId={primary.id} />
        </div>
      </section>
    </main>
  );
}
