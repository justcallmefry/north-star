import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getCurrentRelationshipId } from "@/lib/current-relationship";
import { AgreementSection } from "./agreement-section";

export const dynamic = "force-dynamic";

export default async function AgreementPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationshipId = await getCurrentRelationshipId();
  if (!relationshipId) redirect("/app");

  return (
    <AgreementSection
      relationshipId={relationshipId}
      sessionUserName={session.user.name ?? null}
      sessionUserImage={(session.user as { image?: string | null }).image ?? null}
    />
  );
}
