import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { isBuildTime } from "@/lib/build";
import { getServerAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { getMyActiveRelationships } from "@/lib/relationships";
import { getLatestInvite } from "@/lib/relationships";
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
    redirect("/onboarding");
  }

  const rid = relationshipId ?? relationships[0]?.id;
  if (!rid) {
    if (isBuildTime()) return fallback;
    redirect("/onboarding");
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
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-6 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center justify-center">
        <div className="w-full space-y-6 rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.9)] sm:px-6 sm:py-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/80 ring-1 ring-slate-700/80">
                <Image
                  src="/north-star-logo.png"
                  alt="North Star"
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                  priority
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Invite your partner
                </p>
                <p className="text-sm text-slate-300">
                  Share the link so they can join.
                </p>
              </div>
            </div>
            <Link href="/app" className="hidden text-xs font-medium text-sky-300 hover:text-sky-200 sm:inline">
              ← Back to today
            </Link>
          </div>

          <InviteContent
            relationshipId={rid}
            relationshipName={relationship.name}
            code={code}
            origin={origin}
          />

          <p className="text-center text-xs text-slate-500 sm:hidden">
            <Link href="/app" className="underline hover:no-underline">
              ← Back to today
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
