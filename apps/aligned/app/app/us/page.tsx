import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyTogetherIllustration } from "@/components/illustrations";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { SignOutButton } from "./sign-out-button";
import { DeleteAccountForm } from "./delete-account-form";

export const dynamic = "force-dynamic";

export default async function UsPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");
  if (!session.user.email) redirect("/login");

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
          You
        </p>
        <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
          You &amp; your space
        </h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          How you show up in the app—and how Aligned treats your words.
        </p>
      </header>

      <section className="ns-stack-tight">
        <div className="ns-card border-emerald-200/60 bg-emerald-50/25">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-900/80 sm:text-xs">
            Privacy in plain language
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-900">How your answers work</p>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-700 sm:text-base marker:text-emerald-600">
            <li>
              Daily answers stay <span className="font-medium text-slate-900">hidden from your partner</span> until
              you&apos;ve both replied—then you open together.
            </li>
            <li>
              Nudges only go to <span className="font-medium text-slate-900">your linked partner</span>, not a feed or
              public list.
            </li>
            <li>
              Our Week notes show each side when <span className="font-medium text-slate-900">you&apos;ve both saved</span>{" "}
              that week—same private spirit as your daily reveal.
            </li>
          </ul>
          <p className="mt-4 text-sm text-slate-600">
            <Link href="/privacy" className="font-medium text-brand-600 hover:text-brand-700">
              Full privacy policy →
            </Link>
          </p>
        </div>

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

        <div className="ns-card mt-6 border-red-100/80 bg-red-50/20">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-red-900/70 sm:text-xs">
            Delete account
          </h2>
          <p className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">Leave and remove your data</p>
          <DeleteAccountForm userEmail={session.user.email} hasPassword={hasPassword} />
        </div>
      </section>

      {primary ? (
        <section className="space-y-4">
          <div className="ns-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Relationship</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">
                {primary.name ?? "Your relationship"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Invites, pairing, and leaving this space live in one place.
              </p>
            </div>
            <span className="inline-flex w-fit shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200/80">
              Connected
            </span>
          </div>

          <Link
            href="/app/us/relationship"
            className="ns-btn-primary block w-full text-center py-3.5 text-sm font-semibold"
          >
            Manage relationship &amp; invites
          </Link>

          {insights && (
            <div className="ns-card bg-white/80">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
                A little context
              </h2>
              <div className="mt-3 space-y-2 text-sm text-slate-700 sm:text-base leading-relaxed">
                <p>
                  You&apos;ve shown up for{" "}
                  <span className="font-semibold text-slate-900">{insights.answeredCount}</span> questions together—small
                  moments that add up.
                </p>
                {insights.topCategory && (
                  <p>
                    Lately, many of your prompts made space for{" "}
                    <span className="font-semibold text-slate-900">{insights.topCategory}</span>
                    —that&apos;s a thread worth noticing, not a score.
                  </p>
                )}
                {insights.longestStreak > 0 && (
                  <p>
                    Your longest run so far:{" "}
                    <span className="font-semibold text-slate-900">
                      {insights.longestStreak} day{insights.longestStreak === 1 ? "" : "s"}
                    </span>{" "}
                    in a row. Every week is a fresh start if you need it.
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

