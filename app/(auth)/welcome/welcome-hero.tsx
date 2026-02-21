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
      {/* 3 MIN / DAY badge */}
      <span
        className="inline-flex items-center rounded-full bg-pink-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-pink-600 ring-1 ring-pink-100"
        aria-hidden
      >
        3 min / day
      </span>

      {/* Logo */}
      <div
        className="mt-4 flex h-40 w-40 items-center justify-center rounded-2xl border border-pink-100 bg-white/90 shadow-sm ring-1 ring-pink-50 sm:h-52 sm:w-52"
        aria-hidden
      >
        <div className="relative h-36 w-36 sm:h-44 sm:w-44">
          <Image
            src="/north-star-app-logo.png"
            alt=""
            fill
            className="object-contain"
            sizes="(max-width: 640px) 144px, 176px"
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

      {/* Proof / benefits card */}
      <div className="mt-5 w-full rounded-2xl border border-pink-100 bg-white/80 px-4 py-3.5 shadow-sm ring-1 ring-pink-50/80 sm:px-5 sm:py-4">
        <ul className="space-y-3">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-600 ring-1 ring-pink-100">
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
        className="ns-btn-primary mt-3 block w-full py-3.5 text-center text-base"
      >
        Sign up with email
      </Link>
      <p className="mt-2 text-center text-xs text-slate-500">
        Takes ~30 seconds to start.
      </p>
    </div>
  );
}
