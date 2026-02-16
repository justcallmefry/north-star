import { redirect } from "next/navigation";
import { isBuildTime } from "@/lib/build";
import { getServerAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const fallback = (
  <main className="min-h-screen p-8">
    <p className="text-gray-500">Loading…</p>
  </main>
);

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  if (!session) {
    if (isBuildTime()) return fallback;
    redirect("/login");
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Signed in as {session.user?.email}
      </p>
    </main>
  );
}
