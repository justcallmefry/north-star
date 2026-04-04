import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { isBuildTime } from "@/lib/build";
import { getServerAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { getMyActiveRelationships } from "@/lib/relationships";
import { CreateRelationshipForm } from "./create-form";

const fallback = (
  <main className="min-h-screen flex flex-col items-center justify-center p-8">
    <p className="text-gray-500">Loading…</p>
  </main>
);

export default async function OnboardingPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    if (isBuildTime()) return fallback;
    redirect("/login");
  }

  const relationships = await getMyActiveRelationships();
  if (relationships.length > 0) {
    if (isBuildTime()) return fallback;
    redirect("/app"); // already in a relationship
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100/50 via-[#e2ebe4] to-[#d4e2d9] px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg items-center justify-center">
        <div className="w-full space-y-6 rounded-2xl border-2 border-emerald-800/10 bg-[#f6faf7] px-4 py-6 shadow-lg shadow-emerald-900/5 ring-1 ring-emerald-900/5 sm:px-6 sm:py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-emerald-200/80 shadow-sm">
              <Image
                src="/aligned-icon.png"
                alt="Aligned"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                Welcome to Aligned
              </p>
              <p className="text-sm text-slate-600">
                Name your space and invite your partner—then you&apos;ll get the same question each day, with answers
                that unlock together.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <CreateRelationshipForm />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-emerald-800/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#f6faf7] px-3 text-slate-500">or</span>
              </div>
            </div>

            <Link
              href="/app"
              className="block w-full rounded-xl border border-slate-300/90 bg-white/90 px-4 py-2.5 text-center text-sm font-medium text-slate-700 shadow-sm hover:border-slate-400 hover:bg-white"
            >
              I&apos;ll invite later—take me to Today
            </Link>
            <p className="text-center text-xs text-slate-500">
              You can explore extras, but the daily question needs a pair.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
