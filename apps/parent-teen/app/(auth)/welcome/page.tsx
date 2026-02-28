import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { RedirectIfAuthenticated } from "../redirect-if-authenticated";
import { WelcomeHero } from "./welcome-hero";

export const dynamic = "force-dynamic";

const loginHref =
  typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/login`
    : "/login";

const signupHref =
  typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/signup`
    : "/signup";

/**
 * Welcome (landing) content. Rendered at / (main page). /welcome redirects to /.
 * No server-side auth or DB call — always returns HTML so the page loads reliably on Vercel.
 * Logged-in users redirect to /app on the client.
 */
export function WelcomeContent() {
  return (
    <RedirectIfAuthenticated>
      {/* Gradient: white → soft blue for depth */}
      <main className="min-h-screen flex flex-col bg-gradient-to-b from-white via-brand-50/40 to-brand-100/50 text-slate-900">
        {/* Sign In — top right, visible secondary action */}
        <header className="flex justify-end px-4 pt-4 sm:px-6 sm:pt-5">
          <a
            href={loginHref}
            className="rounded-lg border border-slate-300/80 bg-white/80 px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-400 hover:bg-white hover:text-slate-900"
          >
            Sign in
          </a>
        </header>

        {/* Hero: big logo + CREATE ACCOUNT */}
        <section className="flex flex-col items-center px-4 pt-4 pb-6 sm:px-6 sm:pt-6 sm:pb-8">
          {/* Big logo — Aligned Connecting Families (with wording) */}
          <div
            className="flex h-48 w-full max-w-sm items-center justify-center sm:h-56"
            aria-hidden
          >
            <div className="relative h-full w-full">
              <Image
                src="/aligned-connecting-families-logo.png"
                alt="Aligned Connecting Families"
                fill
                className="object-contain"
                sizes="(max-width: 640px) 100vw, 24rem"
                priority
              />
            </div>
          </div>
          {/* Primary CTA */}
          <div className="mt-8 w-full max-w-sm">
            <a
              href={signupHref}
              className="ns-btn-accent block w-full py-3.5 text-center text-base font-medium"
            >
              CREATE ACCOUNT
            </a>
          </div>
        </section>

        {/* Benefits + extra copy below */}
        <section className="flex-1 flex flex-col items-center px-4 pb-6 sm:px-6 sm:pb-8">
          <WelcomeHero />
        </section>

        {/* Legal — bottom */}
        <footer
          className="px-4 py-4 sm:px-6 sm:py-5"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom) + 0.5rem)" }}
        >
          <p className="text-center text-xs text-slate-500 leading-relaxed">
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
    </RedirectIfAuthenticated>
  );
}

/** /welcome → redirect to canonical home (/) so the main URL is alignedconnectingcouples.com */
export default function WelcomePage() {
  redirect("/");
}
