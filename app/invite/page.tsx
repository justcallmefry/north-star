import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { getLatestInvite } from "@/lib/relationships";
import { InviteContent } from "./invite-content";

type Props = { searchParams: Promise<{ relationshipId?: string; code?: string }> };

export default async function InvitePage({ searchParams }: Props) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const relationshipId = params.relationshipId;
  const relationships = await getMyActiveRelationships();

  if (relationships.length === 0 && !relationshipId) redirect("/onboarding");

  const rid = relationshipId ?? relationships[0]?.id;
  if (!rid) redirect("/onboarding");

  const invite = await getLatestInvite(rid);
  const code = params.code ?? invite?.code ?? null;
  const relationship = relationships.find((r) => r.id === rid) ?? { id: rid, name: null };
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const origin = headersList.get("x-forwarded-proto")
    ? `${headersList.get("x-forwarded-proto")}://${host}`
    : `http://${host}`;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Invite your partner</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Share this code or link so they can join.
          </p>
        </div>
        <InviteContent
          relationshipId={rid}
          relationshipName={relationship.name}
          code={code}
          origin={origin}
        />
        <p className="text-center text-sm text-gray-500">
          <Link href="/app" className="underline hover:no-underline">
            Back to app
          </Link>
        </p>
      </div>
    </main>
  );
}
