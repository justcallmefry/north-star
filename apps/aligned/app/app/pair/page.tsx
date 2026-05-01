import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { isBuildTime } from "@/lib/build";
import { AppGate } from "../app-gate";
import { PairContent } from "./pair-content";

export const dynamic = "force-dynamic";

export default async function PairPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    if (isBuildTime()) return null;
    return <AppGate callbackUrl="/app/pair" />;
  }

  const relationships = await getMyActiveRelationships();
  if (relationships.length > 0 && !isBuildTime()) {
    redirect("/app");
  }

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between gap-4 pb-4">
        <div className="relative h-9 w-9 shrink-0" aria-hidden>
          <Image
            src="/aligned-icon.png"
            alt=""
            width={36}
            height={36}
            className="object-contain"
          />
        </div>
        <Link
          href="/app"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Next
        </Link>
      </header>

      <div className="flex flex-col gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 ring-1 ring-brand-200 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
              One more step
            </span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 tracking-tight sm:text-3xl">
            Bring your person in.
          </h1>
          <p className="mt-2 text-slate-600 sm:text-base">
            One question a day, answered privately, revealed together. Invite your partner to start.
          </p>
        </div>

        <PairContent userFirstName={(session.user.name ?? null) as string | null} />
      </div>
    </div>
  );
}
