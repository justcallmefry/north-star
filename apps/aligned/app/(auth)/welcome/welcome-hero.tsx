import { Clock, ThumbsUp, Heart, Lock } from "lucide-react";

const BENEFITS = [
  { icon: Clock, text: "About three minutes—built for full schedules." },
  { icon: Lock, text: "Replies stay private until you've both sent yours." },
  { icon: ThumbsUp, text: "For couples who want connection without a workbook." },
  { icon: Heart, text: "Prompts stay kind and forward-looking by design." },
] as const;

/** Benefit list + proof below the fold on the welcome screen. */
export function WelcomeHero() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center">
      <div
        className="mt-2 w-full rounded-2xl border border-brand-100/80 bg-gradient-to-b from-white/95 to-brand-50/60 px-4 py-3.5 ring-1 ring-brand-50/80 sm:px-5 sm:py-4"
        style={{
          boxShadow:
            "0 4px 12px -2px rgb(251 207 232 / 0.22), 0 2px 6px -2px rgb(251 207 232 / 0.12)",
        }}
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

      <p className="mt-5 text-center text-xs text-slate-500">Built for privacy • No ads</p>
      <p className="mt-2 text-center text-xs font-medium text-brand-600">
        For couples who prefer showing up to performing.
      </p>
    </div>
  );
}
