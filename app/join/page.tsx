import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { JoinForm } from "./join-form";

type Props = { searchParams: Promise<{ code?: string }> };

export default async function JoinPage({ searchParams }: Props) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const initialCode = params.code ?? "";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Join a relationship</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Enter the invite code your partner shared with you.
          </p>
        </div>
        <JoinForm initialCode={initialCode} />
        <p className="text-center text-sm text-gray-500">
          <Link href="/app" className="underline hover:no-underline">
            Back to app
          </Link>
        </p>
      </div>
    </main>
  );
}
