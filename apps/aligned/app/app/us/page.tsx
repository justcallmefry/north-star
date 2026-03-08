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

  const insights = primary
    ? await (async () => {
        const [answeredCount, sessionsWithPrompt, streakRow] = await Promise.all([
          prisma.dailySession.count({
            where: { relationshipId: primary.id, responses: { some: {} } },
          }),
          prisma.dailySession.findMany({
            where: { relationshipId: primary.id, responses: { some: {} }, prompt: { isNot: null } },
            select: { prompt: { select: { category: true } } },
            take: 200,
          }),
          prisma.streak.findUnique({
            where: { relationshipId: primary.id },
            select: { currentCount: true, longestCount: true },
          }),
        ]);

        const categoryCounts: Record<string, number> = {};
        for (const s of sessionsWithPrompt) {
          const cat = s.prompt?.category;
          if (!cat) continue;
          categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
        }
        const topCategory =
          Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

        const prettyCategory =
          topCategory === "gratitude"
            ? "gratitude"
            : topCategory === "communication"
              ? "communication"
              : topCategory === "reflection"
                ? "reflection"
                : topCategory === "fun"
                  ? "fun"
                  : topCategory === "growth"
                    ? "growth"
                    : topCategory
                      ? topCategory
                      : null;

        return {
          answeredCount,
          topCategory: prettyCategory,
          currentStreak: streakRow?.currentCount ?? 0,
          longestStreak: streakRow?.longestCount ?? 0,
        };
      })()
    : null;

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
                  Invite your partner, see status, manage or leave the relationship.
                </p>
              </div>
              <div className="hidden shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
                Connected
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/invite"
                className="ns-btn-primary block w-full text-center py-3"
              >
                Invite partner
              </Link>
              <Link
                href="/app/us/relationship"
                className="ns-btn-secondary block w-full text-center py-3"
              >
                Manage relationship
              </Link>
            </div>

            <div className="mt-4 border-t border-brand-100 pt-3">
              <RelationshipActions relationshipId={primary.id} />
            </div>
          </div>

          {insights && (
            <div className="ns-card">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
                How you&apos;ve been showing up
              </h2>
              <div className="mt-3 space-y-1.5 text-sm text-slate-700 sm:text-base">
                <p>
                  You&apos;ve answered{" "}
                  <span className="font-semibold text-slate-900">
                    {insights.answeredCount}
                  </span>{" "}
                  questions together.
                </p>
                {insights.topCategory && (
                  <p>
                    You tend to lean toward{" "}
                    <span className="font-semibold text-slate-900">
                      {insights.topCategory}
                    </span>{" "}
                    questions.
                  </p>
                )}
                {insights.longestStreak > 0 && (
                  <p>
                    Your longest streak so far is{" "}
                    <span className="font-semibold text-slate-900">
                      {insights.longestStreak} day
                      {insights.longestStreak === 1 ? "" : "s"}
                    </span>
                    .
                  </p>
                )}
              </div>
            </div>
          )}
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
              className="ns-btn-primary mt-5 block w-full text-center py-3.5"
            >
              Pair with partner
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

