import { getServerAuthSession } from "@/lib/auth";
import { getActiveRelationshipsForUser } from "@/lib/relationships";
import { getSpotlightStatus } from "@/lib/spotlight";
import { RedirectToLogin } from "../redirect-to-login";
import { SpotlightClient } from "./spotlight-client";

export const dynamic = "force-dynamic";

export default async function SpotlightPage() {
  const session = await getServerAuthSession();
  if (!session?.user) return <RedirectToLogin callbackUrl="/app/spotlight" />;

  const relationships = await getActiveRelationshipsForUser(session.user.id);
  const rel = relationships[0];
  if (!rel) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-center text-slate-500">No active relationship found.</p>
      </main>
    );
  }

  const status = await getSpotlightStatus(rel.id);

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <SpotlightClient relationshipId={rel.id} status={status} />
    </main>
  );
}
