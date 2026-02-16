import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { getToday } from "@/lib/sessions";
import { RelationshipActions } from "./relationship-actions";
import { TodayCard } from "./today-card";

export default async function AppPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const relationshipId = relationships[0]?.id ?? null;
  const today = relationshipId ? await getToday(relationshipId) : null;

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">App</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Signed in as {session.user.email}
      </p>
      {relationships.length > 0 ? (
        <div className="mt-6 space-y-6">
          <TodayCard today={today} />
          <p>
            <Link href="/app/meeting" className="text-sm text-indigo-600 underline dark:text-indigo-400">
              Weekly meeting
            </Link>
          </p>
          <div className="space-y-2">
            <h2 className="font-semibold">Your relationship</h2>
            <p className="text-sm text-gray-500">
              {relationships[0].name ?? "Unnamed"} ·{" "}
              <Link href="/invite" className="underline">
                Invite partner
              </Link>
            </p>
            <RelationshipActions relationshipId={relationships[0].id} />
          </div>
          <p className="flex gap-4">
            <Link href="/app/history" className="text-sm text-indigo-600 underline dark:text-indigo-400">
              View history
            </Link>
            <Link href="/app/meeting/history" className="text-sm text-indigo-600 underline dark:text-indigo-400">
              Meeting history
            </Link>
          </p>
        </div>
      ) : (
        <p className="mt-6">
          <Link href="/onboarding" className="text-blue-600 underline">
            Start or join a relationship
          </Link>
        </p>
      )}
    </main>
  );
}
