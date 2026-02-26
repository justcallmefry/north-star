import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { getSession } from "@/lib/sessions";
import { SessionContent } from "./session-content";

type Props = { params: Promise<{ id: string }> };

export default async function SessionPage({ params }: Props) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/");

  const { id } = await params;
  const data = await getSession(id);
  if (!data) notFound();

  return (
    <div className="space-y-4">
      <p>
        <Link
          href="/app"
          className="text-sm font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 rounded"
        >
          ← Back to today
        </Link>
      </p>
      <SessionContent data={data} currentUserId={session.user.id} />
    </div>
  );
}
