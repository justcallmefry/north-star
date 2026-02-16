import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { getSession } from "@/lib/sessions";
import { SessionContent } from "./session-content";

type Props = { params: Promise<{ id: string }> };

export default async function SessionPage({ params }: Props) {
  const session = await getServerAuthSession();
  if (!session?.user) return notFound();

  const { id } = await params;
  const data = await getSession(id);
  if (!data) notFound();

  return (
    <main className="min-h-screen p-8">
      <p className="mb-4">
        <Link href="/app" className="text-sm text-indigo-600 underline dark:text-indigo-400">
          ← Back to app
        </Link>
      </p>
      <h1 className="text-2xl font-bold">Session</h1>
      <SessionContent data={data} currentUserId={session.user.id} />
    </main>
  );
}
