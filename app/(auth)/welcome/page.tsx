import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { isBuildTime } from "@/lib/build";
import { WelcomeCarousel } from "./welcome-carousel";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  let session = null;
  try {
    session = await getServerAuthSession();
  } catch {
    // If auth/DB fails (e.g. serverless cold start), still show welcome so the site isn't broken
  }
  if (session?.user) {
    if (!isBuildTime()) redirect("/app");
    return null;
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Top row: logo left, Log in right */}
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="relative h-10 w-10 shrink-0" aria-hidden>
          <Image
            src="/north-star-app-logo.png"
            alt=""
            width={40}
            height={40}
            className="object-contain"
            priority
          />
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
