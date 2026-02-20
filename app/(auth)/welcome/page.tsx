import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { isBuildTime } from "@/lib/build";
import { WelcomeCarousel } from "./welcome-carousel";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const session = await getServerAuthSession();
  if (session?.user) {
    if (!isBuildTime()) redirect("/app");
    return null;
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Top row: star icon left, Log in right */}
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 ring-1 ring-pink-200/80"
          aria-hidden
        >
          <Sparkles className="h-5 w-5 text-pink-500" strokeWidth={1.7} />
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-slate-700 hover:text-slate-900 underline underline-offset-2"
        >
          Log in
        </Link>
      </header>

      {/* Center: carousel */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6">
        <WelcomeCarousel />
      </section>

      {/* Bottom: CTA + legal */}
      <footer
        className="px-4 pb-8 pt-6 sm:px-6 sm:pb-10"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom) + 1rem)" }}
      >
        <p className="text-center text-xs text-slate-500 mb-4">
          Private by design • No ads • No social feed
        </p>
        <Link
          href="/signup"
          className="ns-btn-primary block w-full py-3.5 text-center text-base"
        >
          Sign up with email
        </Link>
        <p className="mt-4 text-center text-xs text-slate-500 leading-relaxed">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-slate-700">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-slate-700">
            Privacy
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}
