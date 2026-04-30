import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { getDareForWeek } from "@/lib/dare";
import { DareClient } from "./dare-client";

export const dynamic = "force-dynamic";

export default async function DarePage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const rel = relationships[0];
  if (!rel) redirect("/app");

  const dare = await getDareForWeek(rel.id);

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <DareClient dare={dare} />
    </main>
  );
}
