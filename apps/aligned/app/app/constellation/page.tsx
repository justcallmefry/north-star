import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { getConstellation } from "@/lib/constellation";
import { ConstellationClient } from "./constellation-client";

export const dynamic = "force-dynamic";

export default async function ConstellationPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const primary = relationships[0] ?? null;
  if (!primary) redirect("/app/pair");

  const data = await getConstellation(primary.id);

  return <ConstellationClient data={data} />;
}
