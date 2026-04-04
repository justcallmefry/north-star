import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { RedirectIfAuthenticated } from "../redirect-if-authenticated";
import { WelcomeHero } from "./welcome-hero";

export const dynamic = "force-dynamic";

const root =
  typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
    : "";

const loginHref = root ? `${root}/login` : "/login";
const signupHref = root ? `${root}/signup` : "/signup";
const joinHref = root ? `${root}/join` : "/join";

/**
 * Welcome (landing) content. Rendered at / (main page). /welcome redirects to /.
 * No server-side auth or DB call — always returns HTML so the page loads reliably on Vercel.
 * Logged-in users redirect to /app on the client.
 */
export function WelcomeContent() {
  return (
    <RedirectIfAuthenticated>
      <main className="flex min-h-screen flex-col bg-gradient-to-b from-white via-brand-50/40 to-brand-100/50 text-slate-900">
        <header className="flex justify-end px-4 pt-4 sm:px-6 sm:pt-5">
          <a
            href={loginHref}
            className="rounded-lg border border-slate-300/80 bg-white/80 px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-400 hover:bg-white hover:text-slate-900"
          >
            Sign in
          </a>
        </header>

        <section className="flex flex-col items-center px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-4">
          <div className="flex h-44 w-full max-w-sm items-center justify-center sm:h-52" aria-hidden>
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

          <div className="mt-4 w-full max-w-md text-center">
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-50 to-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-600 ring-1 ring-brand-100/80">
              One question · Two private answers · Open together
            </span>
            <h1 className="mt-4 text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
              The 3-minute ritual that keeps you close—without the heavy stuff.
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              You each answer the same prompt on your own; nothing unlocks until you&apos;re both done—then you read it
              together.
            </p>
            <p className="mt-2 text-sm font-medium text-slate-700">No feed. Just you two.</p>
          </div>

          <div className="mt-8 w-full max-w-sm space-y-3">
            <a
              href={signupHref}
              className="ns-btn-accent block w-full py-3.5 text-center text-base font-medium"
            >
              Start free — invite your partner
            </a>
            <p className="text-center text-xs text-slate-500">Free · Private · No social feed</p>
            <p className="text-center text-sm">
              <Link href={joinHref} className="font-medium text-brand-700 underline-offset-2 hover:underline">
                Have an invite code?
              </Link>
              <span className="text-slate-600"> — join your partner&apos;s space</span>
            </p>
          </div>
        </section>

        <section className="flex flex-1 flex-col items-center px-4 pb-6 sm:px-6 sm:pb-8">
          <WelcomeHero />
        </section>

        <footer
          className="px-4 py-4 sm:px-6 sm:py-5"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom) + 0.5rem)" }}
        >
          <p className="text-center text-xs leading-relaxed text-slate-500">
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
