import { redirect } from "next/navigation";
import { isBuildTime } from "@/lib/build";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";

export const dynamic = "force-dynamic";

const fallback = (
  <main className="flex min-h-screen flex-col items-center justify-center p-8">
    <p className="text-gray-500">Loading…</p>
  </main>
);

/** Canonical pairing lives at `/app/pair`; this route avoids a duplicate onboarding funnel. */
export default async function OnboardingPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    if (isBuildTime()) return fallback;
    redirect(`/login?callbackUrl=${encodeURIComponent("/app/pair")}`);
  }

  const relationships = await getMyActiveRelationships();
  if (relationships.length > 0) {
    if (isBuildTime()) return fallback;
    redirect("/app");
  }

  if (isBuildTime()) return fallback;
  redirect("/app/pair");
}
