import Link from "next/link";
import Image from "next/image";
import { RedirectIfAuthenticated } from "../redirect-if-authenticated";
import { WelcomeHero } from "./welcome-hero";

export const dynamic = "force-dynamic";

const loginHref =
  typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/login`
    : "/login";

/**
 * Welcome (landing) page. No server-side auth or DB call — always returns HTML
 * so the page loads reliably on Vercel. Logged-in users redirect to /app on the client.
 */
export default function WelcomePage() {
  return (
    <RedirectIfAuthenticated>
      {/* Gradient: white → soft blue for depth */}
      <main className="min-h-screen flex flex-col bg-gradient-to-b from-white via-brand-50/40 to-brand-100/50 text-slate-900">
        {/* Header: logo + app name left, Log in right */}
        <header className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <div className="relative h-9 w-9 shrink-0 sm:h-10 sm:w-10" aria-hidden>
              <Image
                src="/aligned-icon.png"
                alt=""
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <span className="font-display text-lg font-medium text-slate-800 sm:text-xl">
              Aligned: Connecting Couples
            </span>
          </div>
          <a href={loginHref} className="ns-btn-secondary !py-2 text-sm inline-flex">
            Log in
          </a>
        </header>

        {/* Hero + benefits + CTA — consistent 8/12/16 spacing, scrollable */}
        <section className="flex-1 flex flex-col items-center px-4 pt-2 pb-6 sm:px-6 sm:pt-4 sm:pb-8">
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
