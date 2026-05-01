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
import { AccountDataSection } from "./account-data-section";

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
        <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
          {currentName ? `Hi, ${currentName.split(" ")[0]}` : "Your profile"}
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Your relationship dashboard
        </p>
      </header>

      {primary ? (
        <section className="ns-stack-tight">
          {/* 1. Stats hero */}
          {insights && (
            <section className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-dusk-50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Your story so far</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{insights.answeredCount}</p>
                  <p className="text-xs text-slate-500 mt-0.5">questions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{insights.longestStreak}</p>
                  <p className="text-xs text-slate-500 mt-0.5">day best streak</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{insights.currentStreak}</p>
                  <p className="text-xs text-slate-500 mt-0.5">day streak now</p>
                </div>
              </div>
              {insights.topCategory && (
                <p className="text-sm text-slate-600">
                  You lean toward <span className="font-semibold text-slate-900">{insights.topCategory}</span> questions.
                </p>
              )}
              <Link href="/app/insights" className="ns-btn-secondary block w-full text-center py-2.5 text-sm">
                View couple insights →
              </Link>
            </section>
          )}

          {/* 2. Relationship card */}
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

          {/* 3. Past responses */}
          <Link
            href="/app/history"
            className="ns-card flex items-center justify-between gap-3 transition active:scale-[0.99] hover:border-dusk-300/70"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
                Your story so far
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">
                Past responses
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Browse everything you&apos;ve answered together.
              </p>
            </div>
            <span className="text-xl text-slate-400" aria-hidden>→</span>
          </Link>

          {/* 4. Profile editing */}
          <div className="ns-card">
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Edit profile</h2>
            <p className="mt-1 text-sm text-slate-600 sm:text-base">
              Change your display name, photo (JPG or PNG, max 2MB), or pick an icon. Your email stays the
              same for sign-in.
            </p>

            <ProfileForm currentName={currentName} currentAvatar={currentAvatar} />
          </div>

          {/* 5. Sign-in / password */}
          <div className="ns-card">
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

          {/* 6. Account data */}
          <AccountDataSection />
        </section>
      ) : (
        <>
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

          <section className="ns-stack-tight mt-4">
            {/* Profile editing for solo users */}
            <div className="ns-card">
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Edit profile</h2>
              <p className="mt-1 text-sm text-slate-600 sm:text-base">
                Change your display name, photo (JPG or PNG, max 2MB), or pick an icon. Your email stays the
                same for sign-in.
              </p>

              <ProfileForm currentName={currentName} currentAvatar={currentAvatar} />
            </div>

            <div className="ns-card">
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

            <AccountDataSection />
          </section>
        </>
      )}
    </main>
  );
}
