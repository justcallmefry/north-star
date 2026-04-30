"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = {
  firstName: string | null;
};

export function WelcomeContent({ firstName }: Props) {
  const greeting = firstName?.trim() ? `Welcome, ${firstName.trim()}.` : "Welcome.";

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-2 py-8 text-center">
      <div className="space-y-6 max-w-sm">
        <p
          className="font-display text-3xl font-semibold text-slate-900 sm:text-4xl animate-fade-in-ease"
        >
          {greeting}
        </p>

        <div className="space-y-4 text-base text-slate-700 sm:text-lg">
          <p
            className="animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            One question a day.
          </p>
          <p
            className="animate-fade-in-up"
            style={{ animationDelay: "700ms" }}
          >
            Answered privately.
          </p>
          <p
            className="animate-fade-in-up font-medium text-dusk-600"
            style={{ animationDelay: "1200ms" }}
          >
            Revealed together.
          </p>
        </div>

        <div
          className="animate-fade-in-up pt-4"
          style={{ animationDelay: "1900ms" }}
        >
          <Link
            href="/app/pair"
            className="ns-btn-primary inline-flex w-full items-center justify-center gap-2 py-3.5 sm:px-8"
          >
            Bring in your partner
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </main>
  );
}
