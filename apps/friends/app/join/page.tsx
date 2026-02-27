import { redirect } from "next/navigation";
import Link from "next/link";
import { isBuildTime } from "@/lib/build";
import { getServerAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { JoinForm } from "./join-form";

type Props = { searchParams: Promise<{ code?: string }> };

const fallback = (
  <main className="min-h-screen flex flex-col items-center justify-center p-8">
    <p className="text-gray-500">Loading…</p>
  </main>
);

export default async function JoinPage({ searchParams }: Props) {
  const session = await getServerAuthSession();
  const params = await searchParams;
  const initialCode = params.code ?? "";

  if (!session?.user) {
    if (isBuildTime()) return fallback;
    const callbackUrl = "/join" + (initialCode ? `?code=${encodeURIComponent(initialCode)}` : "");
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

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
