import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyTogetherIllustration } from "@/components/illustrations";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { getCurrentRelationshipId } from "@/lib/current-relationship";
import { prisma } from "@/lib/prisma";
import { RelationshipActions } from "../relationship-actions";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { SignOutButton } from "./sign-out-button";
import { RoleInSpaceForm } from "./role-in-space-form";

export const dynamic = "force-dynamic";

export default async function UsPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const currentId = await getCurrentRelationshipId();
  const primary = (currentId ? relationships.find((r) => r.id === currentId) : null) ?? relationships[0] ?? null;
  const currentName = session.user.name ?? "";
  const currentAvatar = (session.user.image as string | null) ?? "";

  const userRow = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  const hasPassword = !!userRow?.password;

  const myRoleInPrimary =
    primary &&
    (await prisma.relationshipMember.findFirst({
      where: {
        relationshipId: primary.id,
        userId: session.user.id,
        leftAt: null,
      },
      select: { role: true },
    }));
  const normalizedRole =
    myRoleInPrimary?.role === "young_adult"
      ? ("young_adult" as const)
      : ("parent" as const);

  return (
    <main className="flex h-full flex-col ns-stack">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500 sm:text-sm">
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
            Change your display name, photo (JPG or PNG, max 2MB), or pick an icon. Your email stays the
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
          <div className="ns-shadow-glow rounded-2xl border border-brand-100/80 bg-white px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
                  Relationship
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900 sm:text-2xl">
                  {primary.name ?? "Your relationship"}
                </p>
                <p className="text-sm text-slate-600 sm:text-base">
                  Invite a parent or child. See status, manage, or leave this space.
                </p>
              </div>
              <div className="hidden shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
                Connected
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
              <RoleInSpaceForm
                relationshipId={primary.id}
                currentRole={normalizedRole}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/invite"
                className="ns-btn-primary"
              >
                Invite parent or child
              </Link>
              <Link
                href="/join"
                className="ns-btn-secondary"
              >
                Join with a code
              </Link>
              <Link
                href="/app/us/relationship"
                className="ns-btn-secondary"
              >
                Manage relationship
              </Link>
            </div>

            <div className="mt-4 border-t border-brand-100 pt-3">
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
              Get an invite code to text your partner or young adult, or enter a code they sent you.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/app/pair"
                className="ns-btn-primary inline-flex justify-center"
              >
                Create or pair
              </Link>
              <Link
                href="/join"
                className="ns-btn-secondary inline-flex justify-center"
              >
                I have a code — join
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

