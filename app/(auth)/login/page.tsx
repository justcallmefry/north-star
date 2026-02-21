import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { isBuildTime } from "@/lib/build";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

/** Log in: email + password or magic link. If already logged in, redirect to app. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; debug?: string }> | { callbackUrl?: string; debug?: string };
}) {
  const session = await getServerAuthSession();
  if (session?.user) {
    if (!isBuildTime()) redirect("/app");
    return null;
  }

  const params = typeof searchParams?.then === "function" ? await searchParams : searchParams ?? {};
  const debug = params.debug;

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      {debug && (
        <div className="mx-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-mono text-xs text-amber-800">
          Session debug: {decodeURIComponent(debug)}
        </div>
      )}
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="relative h-9 w-9 shrink-0" aria-hidden>
          <Image
            src="/north-star-app-logo.png"
            alt=""
            width={36}
            height={36}
            className="object-contain"
          />
        </div>
        <Link
          href="/welcome"
          className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-200 rounded-lg py-2 -ml-2"
          aria-label="Back to welcome"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          Back
        </Link>
      </header>

      <section
        className="flex-1 flex flex-col px-4 pb-8 sm:px-6 max-w-md"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom) + 1rem)" }}
      >
        <LoginForm />
      </section>
    </main>
  );
}
