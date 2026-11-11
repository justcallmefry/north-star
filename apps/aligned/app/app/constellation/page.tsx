import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { getConstellation } from "@/lib/constellation";
import { listCapsules } from "@/lib/time-capsules";
import { ConstellationClient } from "./constellation-client";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ born?: string }> };

export default async function ConstellationPage({ searchParams }: Props) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const primary = relationships[0] ?? null;
  if (!primary) redirect("/app/pair");

  const [data, capsules] = await Promise.all([getConstellation(primary.id), listCapsules()]);

  const { born } = await searchParams;

  return (
    <ConstellationClient
      data={data}
      bornId={born ?? null}
      capsules={capsules}
      anniversaryISO={primary.anniversaryDate ? primary.anniversaryDate.toISOString().slice(0, 10) : null}
    />
  );
}
