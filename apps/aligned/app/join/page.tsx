import { redirect } from "next/navigation";
import Link from "next/link";
import { isBuildTime } from "@/lib/build";
import { getServerAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { JoinForm } from "./join-form";

type Props = { searchParams: Promise<{ code?: string }> };

const fallback = (
  <main className="min-h-screen flex flex-col items-center justify-center p-8">
    <p className="text-gray-500">One moment.</p>
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
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-100/50 via-[#e2ebe4] to-[#d4e2d9] px-4 py-10 text-slate-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">You&apos;re invited</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base leading-relaxed">
            Aligned is one private prompt a day. You&apos;ll only see each other&apos;s replies after you&apos;ve both
            answered—then you open them together. Enter their code to pair.
          </p>
        </div>
        <JoinForm initialCode={initialCode} />
        <p className="text-center text-sm text-slate-500">
          <Link href="/app" className="font-medium text-brand-600 hover:text-brand-700">
            Back to Today
          </Link>
        </p>
      </div>
    </main>
  );
}
