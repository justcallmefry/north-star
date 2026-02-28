import Image from "next/image";
import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { isBuildTime } from "@/lib/build";
import { getServerAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { getMyActiveRelationships } from "@/lib/relationships";
import { getLatestInvite } from "@/lib/relationships";
import { getCurrentRelationshipId } from "@/lib/current-relationship";
import { InviteContent } from "./invite-content";

type Props = { searchParams: Promise<{ relationshipId?: string; code?: string }> };

const fallback = (
  <main className="min-h-screen flex flex-col items-center justify-center p-8">
    <p className="text-gray-500">Loading…</p>
  </main>
);

export default async function InvitePage({ searchParams }: Props) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    if (isBuildTime()) return fallback;
    redirect("/login");
  }

  const params = await searchParams;
  const relationshipId = params.relationshipId;
  const relationships = await getMyActiveRelationships();

  if (relationships.length === 0 && !relationshipId) {
    if (isBuildTime()) return fallback;
    redirect("/app/pair");
  }

  const currentId = await getCurrentRelationshipId();
  const rid = relationshipId ?? currentId ?? relationships[0]?.id;
  if (!rid) {
    if (isBuildTime()) return fallback;
    redirect("/app/pair");
  }

  const invite = await getLatestInvite(rid);
  const code = params.code ?? invite?.code ?? null;
  const relationship = relationships.find((r) => r.id === rid) ?? { id: rid, name: null };
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const origin = headersList.get("x-forwarded-proto")
    ? `${headersList.get("x-forwarded-proto")}://${host}`
    : `http://${host}`;

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between">
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
          Back to app
        </Link>
      </header>
      <div className="mx-auto w-full max-w-md flex-1 py-6">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Invite your partner
        </h1>
        <p className="mt-2 text-slate-600">
          Share your code or link so they can join. Same code flow as the pair screen.
        </p>
        <div className="mt-8">
          <InviteContent
            relationshipId={rid}
            relationshipName={relationship.name}
            code={code}
            origin={origin}
          />
        </div>
      </div>
    </main>
  );
}
