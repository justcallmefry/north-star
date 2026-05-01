import { Clock, ThumbsUp, Heart, Lock } from "lucide-react";

const BENEFITS = [
  { icon: Clock, text: "Under 3 minutes. No pressure, ever." },
  { icon: ThumbsUp, text: "Works even if your partner is skeptical." },
  { icon: Heart, text: "The conversation you meant to have tonight." },
  { icon: Lock, text: "Private by design. No feed. No notifications spam." },
] as const;

export function WelcomeHero() {
  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      <span
        className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-50 to-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-600 ring-1 ring-brand-100/80"
        aria-hidden
      >
        Free to start · 3 min/day
      </span>

      <h2 className="mt-4 text-center text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
        The daily ritual your relationship deserves.
      </h2>
      <p className="mt-2 text-center text-base text-slate-600">
        One question a day. Both answer privately. Reveal together. Just you two.
      </p>

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

      <p className="mt-5 text-center text-sm text-slate-600">
        Thousands of couples check in together every day.
      </p>
      <p className="mt-3 text-center text-xs font-medium text-brand-600">
        The most meaningful 3 minutes of your day.
      </p>
    </div>
  );
}
