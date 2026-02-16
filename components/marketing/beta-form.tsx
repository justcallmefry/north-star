"use client";

import { Mail } from "lucide-react";

export function BetaForm() {
  return (
    <form
      className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
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
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 sm:max-w-xs"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
      >
        <Mail className="h-4 w-4" />
        Request invite
      </button>
    </form>
  );
}
