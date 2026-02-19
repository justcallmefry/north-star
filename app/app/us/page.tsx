import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyTogetherIllustration } from "@/components/illustrations";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { RelationshipActions } from "../relationship-actions";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function UsPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const primary = relationships[0] ?? null;
  const currentName = session.user.name ?? "";
  const currentAvatar = (session.user.image as string | null) ?? "";

  return (
    <main className="flex h-full flex-col ns-stack">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-500 sm:text-sm">
          Profile
        </p>
        <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
          You & your relationship
        </h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Update your name and icon. Manage your relationship.
        </p>
      </header>

      <section className="ns-stack-tight">
        <div className="ns-card">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
            Your profile
          </h2>
          <p className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">How you appear</p>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Change your display name and pick the icon that represents you. Your email stays the
            same for sign-in.
          </p>

          <ProfileForm currentName={currentName} currentAvatar={currentAvatar} />
        </div>
      </section>

      {primary ? (
        <section className="space-y-4">
          <div className="rounded-2xl border border-pink-100 bg-white px-4 py-4 shadow-md shadow-pink-100/80 sm:px-5 sm:py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
                  Relationship
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900 sm:text-2xl">
                  {primary.name ?? "Your relationship"}
                </p>
                <p className="text-sm text-slate-600 sm:text-base">
                  Invite your partner, see status, manage or leave the relationship.
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
              <Link
                href="/app/us/relationship"
                className="ns-btn-secondary"
              >
                Manage relationship
              </Link>
            </div>

            <div className="mt-4 border-t border-pink-100 pt-3">
              <RelationshipActions relationshipId={primary.id} />
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-4 flex flex-1 items-center justify-center">
          <div className="ns-card max-w-md text-center">
            <div className="flex justify-center">
              <EmptyTogetherIllustration className="w-28 h-28 sm:w-32 sm:h-32" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
              Welcome
            </p>
            <p className="mt-3 text-xl font-semibold text-slate-900 sm:text-2xl">
              Set up your relationship
            </p>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Create or join a relationship to get your first question.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}

