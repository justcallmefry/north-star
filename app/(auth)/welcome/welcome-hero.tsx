import Image from "next/image";
import Link from "next/link";
import { Clock, ThumbsUp, Heart, Lock } from "lucide-react";

const BENEFITS = [
  { icon: Clock, text: "Under 3 minutes a day." },
  { icon: ThumbsUp, text: "Reluctant-partner approved." },
  { icon: Heart, text: "The most valuable screen time you'll do today." },
  { icon: Lock, text: "No gimmicks. Fully private. Always positive." },
] as const;

export function WelcomeHero() {
  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* 3 MIN / DAY badge — gradient for depth */}
      <span
        className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-50 to-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-600 ring-1 ring-brand-100/80"
        aria-hidden
      >
        3 min / day
      </span>

      {/* Logo — full Aligned logo, larger */}
      <div
        className="mt-4 flex h-52 w-52 items-center justify-center rounded-2xl border border-slate-200/80 bg-white ring-1 ring-slate-100/80 sm:h-64 sm:w-64"
        style={{ boxShadow: "0 4px 12px -2px rgb(43 140 190 / 0.15), 0 2px 6px -2px rgb(43 140 190 / 0.1)" }}
        aria-hidden
      >
        <div className="relative h-44 w-44 sm:h-52 sm:w-52">
          <Image
            src="/aligned-connecting-couples-logo.png"
            alt="Aligned: Connecting Couples"
            fill
            className="object-contain"
            sizes="(max-width: 640px) 176px, 208px"
          />
        </div>
      </div>

      {/* Headline — one phrase per line for rhythm and clarity */}
      <h1 className="mt-5 text-center text-2xl font-semibold leading-snug text-slate-900 sm:text-3xl">
        <span className="block">One question a day.</span>
        <span className="mt-1 block">Answer privately.</span>
        <span className="mt-1 block">Reveal together.</span>
      </h1>
      <p className="mt-2 text-center text-base text-slate-600 sm:text-lg">
        Connect daily, effortlessly. Reflect positively. Grow stronger
        together.
      </p>

      {/* Proof / benefits card — gradient + glowy blue shadow */}
      <div
        className="mt-5 w-full rounded-2xl border border-brand-100/80 bg-gradient-to-b from-white/95 to-brand-50/60 px-4 py-3.5 ring-1 ring-brand-50/80 sm:px-5 sm:py-4"
        style={{ boxShadow: "0 4px 12px -2px rgb(251 207 232 / 0.22), 0 2px 6px -2px rgb(251 207 232 / 0.12)" }}
      >
        <ul className="space-y-3">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100/80">
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <span className="text-sm text-slate-700 sm:text-base">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Trust line + CTA block */}
      <p className="mt-5 text-center text-xs text-slate-500">
        Private by design • No ads • No social feed
      </p>
      <Link
        href="/signup"
        className="ns-btn-accent mt-3 block w-full py-3.5 text-center text-base"
      >
        Sign up with email
      </Link>
      <p className="mt-2 text-center text-xs text-slate-500">
        Takes ~30 seconds to start.
      </p>
    </div>
  );
}
