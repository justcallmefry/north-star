import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getActiveRelationshipsForUser } from "@/lib/relationships";
import { getWeeklyRecap, recapIsReady } from "@/lib/weekly-recap";
import { RecapPlayer } from "./recap-player";

export const dynamic = "force-dynamic";

export default async function RecapPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect("/login");

  // Membership is established here: only the caller's own relationship.
  const [relationship] = await getActiveRelationshipsForUser(session.user.id);
  const recap = relationship ? await getWeeklyRecap(relationship.id) : null;

  if (!recap || !recapIsReady(recap)) {
    return (
      <main className="ns-card mx-auto max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Your week together</p>
        <p className="mt-3 font-display text-xl font-semibold text-slate-900">
          Your recap appears once you&apos;ve answered together on two days this week.
        </p>
        <Link href="/app" className="ns-btn-primary mt-5 block w-full py-3 text-center">
          Back to today
        </Link>
      </main>
    );
  }

  return <RecapPlayer recap={recap} />;
}
