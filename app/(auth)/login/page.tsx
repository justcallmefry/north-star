import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { isBuildTime } from "@/lib/build";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

/** Log in: email + password or magic link. If already logged in, redirect to app. */
export default async function LoginPage() {
  const session = await getServerAuthSession();
  if (session?.user) {
    if (!isBuildTime()) redirect("/app");
    return null;
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <header className="flex items-center px-4 py-4 sm:px-6">
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
