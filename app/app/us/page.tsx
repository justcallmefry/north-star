import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyTogetherIllustration } from "@/components/illustrations";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { prisma } from "@/lib/prisma";
import { RelationshipActions } from "../relationship-actions";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { SignOutButton } from "./sign-out-button";

export const dynamic = "force-dynamic";

export default async function UsPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const primary = relationships[0] ?? null;
  const currentName = session.user.name ?? "";
  const currentAvatar = (session.user.image as string | null) ?? "";

  const userRow = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  const hasPassword = !!userRow?.password;

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

        <div className="ns-card mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
            Sign-in
          </h2>
          <p className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">
            {hasPassword ? "Change password" : "Set a password"}
          </p>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            {hasPassword
              ? "Use a password to sign in with email next time."
              : "You signed in with a magic link. Set a password to use email + password on the login page."}
          </p>
          <PasswordForm hasPassword={hasPassword} />
          <SignOutButton />
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
              Get an invite code to text your partner, or enter the code they sent you.
            </p>
            <Link
              href="/app/pair"
              className="ns-btn-primary mt-5 inline-flex"
            >
              Pair with partner
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

