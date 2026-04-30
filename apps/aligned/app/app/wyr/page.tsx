import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { getWyrForToday } from "@/lib/wyr";
import { WyrClient } from "./wyr-client";

export const dynamic = "force-dynamic";

export default async function WyrPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const rel = relationships[0];
  if (!rel) redirect("/app");

  const wyr = await getWyrForToday(rel.id);
  if (!wyr) redirect("/app");

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <WyrClient initialData={wyr} relationshipId={rel.id} />
    </main>
  );
}
