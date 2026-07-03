import { redirect } from "next/navigation";
import { CheckCircle, Sparkles } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { UpgradeButton } from "./upgrade-button";

export const dynamic = "force-dynamic";

interface UpgradePageProps {
  searchParams: { success?: string; canceled?: string };
}

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="ns-stack max-w-lg mx-auto">
      {/* Success state */}
      {searchParams.success && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center">
          <p className="font-semibold text-emerald-800">
            You&apos;re all set. Welcome to Aligned Premium.
          </p>
        </div>
      )}

      {/* Canceled state */}
      {searchParams.canceled && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center">
          <p className="text-amber-800">No problem — you can upgrade anytime.</p>
        </div>
      )}

      {/* Hero */}
      <section className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 ring-1 ring-brand-200">
          <Sparkles className="h-4 w-4 text-brand-500" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Aligned Premium
          </span>
        </div>
        <h1 className="font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
          Keep the ritual going.
        </h1>
        <p className="text-base text-slate-600 sm:text-lg">
          Everything you&apos;ve been using, plus what comes next — built for
          couples who show up for each other.
        </p>
      </section>

      {/* Price card */}
      <section className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-dusk-50 p-6 text-center space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
          First 14 days free
        </p>
        <p className="text-4xl font-bold text-slate-900">
          $29.99
          <span className="text-lg font-normal text-slate-500">/year</span>
        </p>
        <p className="text-sm text-slate-500">
          That&apos;s $2.50 a month — one coffee, split between you.
        </p>
        <p className="text-xs text-slate-400">
          Nothing charged until day 15. Cancel anytime.
        </p>
      </section>

      {/* Features list */}
      <ul className="space-y-3">
        {[
          "Daily questions — the ritual that keeps you connected",
          "Your sky — every day together becomes a star, forever",
          "Your book — every answer, printable as a real keepsake",
          "The Magazine — your week as an editorial issue, every Sunday",
          "Would You Rather & Quiz — play and call each other's picks",
          "Date Night Dares — one real-world challenge every week",
          "Couple Insights — your couple type, alignment, mind-reading",
          "Unlimited Memories — save the moments that matter",
        ].map((feat) => (
          <li key={feat} className="flex items-start gap-3">
            <CheckCircle
              className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5"
              strokeWidth={2}
            />
            <span className="text-sm text-slate-700 sm:text-base">{feat}</span>
          </li>
        ))}
      </ul>

      {/* CTA — client component for the fetch */}
      <UpgradeButton />

      <p className="text-center text-xs text-slate-400">
        Secure payment via Stripe. Card required to start the trial; nothing is
        charged until your 14 days end.
      </p>
    </main>
  );
}
