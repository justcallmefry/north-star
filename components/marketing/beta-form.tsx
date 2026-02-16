"use client";

import { Mail } from "lucide-react";

export function BetaForm() {
  return (
    <div className="mt-3">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
        onSubmit={(e) => e.preventDefault()}
      >
        <label htmlFor="beta-email" className="sr-only">
          Email address
        </label>
        <input
          id="beta-email"
          type="email"
          name="email"
          placeholder="you@example.com"
          className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 sm:max-w-xs"
        />
        <button
          type="submit"
          className="inline-flex h-12 min-h-[3rem] items-center justify-center gap-2 rounded-lg bg-slate-800 px-5 font-semibold text-white shadow-md shadow-slate-900/10 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 sm:shrink-0"
        >
          <Mail className="h-4 w-4" />
          Request invite
        </button>
      </form>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        No spam. Invite-only. Free during beta.
      </p>
    </div>
  );
}
