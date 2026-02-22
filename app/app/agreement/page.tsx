import { redirect } from "next/navigation";
import { Scale } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { getAgreementForToday } from "@/lib/agreement";
import { AgreementClient } from "./agreement-client";

export const dynamic = "force-dynamic";

export default async function AgreementPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const relationshipId = relationships[0]?.id ?? null;
  if (!relationshipId) redirect("/app");

  const agreement = await getAgreementForToday(relationshipId);
  if (!agreement) redirect("/app");

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 text-white shadow-lg shadow-violet-200/80 ring-2 ring-white ring-offset-2">
          <Scale className="h-8 w-8" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          Daily agreement
        </h1>
        <p className="mt-1 max-w-md text-sm text-slate-600 sm:text-base">
          Rate each statement for yourself, then guess how your partner would answer.
        </p>
      </div>
      <AgreementClient
        relationshipId={relationshipId}
        initialData={agreement}
        sessionUserName={session.user.name ?? null}
        sessionUserImage={(session.user as { image?: string | null }).image ?? null}
        partnerImage={agreement.partnerImage ?? null}
      />
    </div>
  );
}
