"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { submitBetaSignup } from "@/lib/beta";

export function BetaForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const result = await submitBetaSignup(email);
      if (result.ok) {
        setMessage({ type: "success", text: result.message });
        setEmail("");
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  if (message?.type === "success") {
    return (
      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-base text-emerald-800">
        {message.text}
      </div>
    );
  }

  return (
    <div className="mt-3">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
        onSubmit={handleSubmit}
      >
        <label htmlFor="beta-email" className="sr-only">
          Email address
        </label>
        <input
          id="beta-email"
          type="email"
          name="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="h-12 min-h-[48px] w-full rounded-lg border border-white/10 bg-white/5 px-4 text-[16px] text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/40 backdrop-blur-md focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:opacity-60 sm:max-w-xs"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 min-h-[48px] items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 text-sm font-semibold text-emerald-950 shadow-md shadow-emerald-500/30 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-60 sm:shrink-0"
        >
          <Mail className="h-4 w-4" />
          {loading ? "Sending…" : "Request invite"}
        </button>
      </form>
      {message?.type === "error" && (
        <p className="mt-2 text-sm text-red-400">{message.text}</p>
      )}
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        No spam. Invite-only. Free during beta.
      </p>
    </div>
  );
}
