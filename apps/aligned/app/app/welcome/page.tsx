import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { WelcomeContent } from "./welcome-content";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  // If they're already paired, the welcome makes no sense — send them home.
  const relationships = await getMyActiveRelationships();
  if (relationships.length > 0) redirect("/app");

  return <WelcomeContent firstName={(session.user.name ?? null) as string | null} />;
}
