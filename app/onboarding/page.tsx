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
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-6 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center justify-center">
        <div className="w-full space-y-6 rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.9)] sm:px-6 sm:py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/80 ring-1 ring-slate-700/80">
              <Image
                src="/north-star-app-logo.png"
                alt="North Star"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Welcome to North Star
              </p>
              <p className="text-sm text-slate-300">
                Set up your first relationship so we can send you both a daily prompt.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <CreateRelationshipForm />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-950 px-3 text-slate-500">or</span>
              </div>
            </div>

            <Link
              href="/app"
              className="block w-full rounded-lg border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-center text-sm font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-900"
            >
              Go solo (skip for now)
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
