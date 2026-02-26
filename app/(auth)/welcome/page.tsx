import Link from "next/link";
import Image from "next/image";
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
 * Welcome (landing) page. No server-side auth or DB call — always returns HTML
 * so the page loads reliably on Vercel. Logged-in users redirect to /app on the client.
 */
export default function WelcomePage() {
  return (
    <RedirectIfAuthenticated>
      {/* Gradient: white → soft blue for depth */}
      <main className="min-h-screen flex flex-col bg-gradient-to-b from-white via-brand-50/40 to-brand-100/50 text-slate-900">
        {/* Hero: big logo + Sign In / Sign up */}
        <section className="flex flex-col items-center px-4 pt-8 pb-6 sm:px-6 sm:pt-12 sm:pb-8">
          {/* Big logo — full wordmark from welcome screen */}
          <div
            className="flex h-48 w-full max-w-sm items-center justify-center sm:h-56"
            aria-hidden
          >
            <div className="relative h-full w-full">
              <Image
                src="/aligned-connecting-couples-logo.png"
                alt="Aligned: Connecting Couples"
                fill
                className="object-contain"
                sizes="(max-width: 640px) 100vw, 24rem"
                priority
              />
            </div>
          </div>
          {/* Two primary CTAs */}
          <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:gap-4">
            <a
              href={loginHref}
              className="ns-btn-primary flex-1 py-3.5 text-center text-base font-medium"
            >
              Sign in
            </a>
            <a
              href={signupHref}
              className="ns-btn-accent flex-1 py-3.5 text-center text-base font-medium"
            >
              Sign up
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
